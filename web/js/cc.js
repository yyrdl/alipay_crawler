/**
 * Created by jason on 2017/10/14.MIT license
 */

(function () {

    var MAX_CALL_STACK_SIZE = 1000000;

    function Instruction(action, type) {
        this._action = action;
        this._args = null;
        this._type = type;
        this._result = null;
        this._ctx = null;
        this._result_name = null;
    }

    Instruction.prototype.args = function () {
        var self = this;
        if (this._args) {
            return this._args.map(function (it) {
                if (it instanceof Instruction) {
                    if (it._result_name) {
                        return self._ctx.GVGS[it._result_name];
                    } else {
                        return it._result;
                    }
                } else {
                    return it;
                }
            })
        } else {
            return null;
        }
    };

    Instruction.prototype._setResult = function (v) {
        this._result = v;
        if (this._result_name) {
            this._ctx.GVGS[this._result_name] = v;
        }
    };

    Instruction.prototype.ctx = function (ctx) {
        this._ctx = ctx;
    };
    Instruction.prototype.assign = function (variable_name) {
        this._result_name = variable_name;
    };
    Instruction.prototype._run = function (env) {
        return this._action.apply(env, this.args());
    };
    Instruction.prototype.result = function () {
        if (this._result_name) {
            return this._ctx.GVGS[this._result_name];
        }
        return this._result;
    };

    var insType = {};
    insType.normal = 1;
    insType.loop = 2;
    insType.break = 3;
    insType.async = 4;
    insType.instruction = 5;

    function isFuture(future) {

        if (future && ("function" === typeof future) && future._runtime_cpu) {
            return true;
        }
        return false;
    }
    /**
     * cc 《叛逆的鲁鲁修》中的谜之女子
     * */
    function cc(func) {

        if ("function" != typeof func) {
            throw TypeError("The arg must be a function!");
        }

        var cpu = {};
        /**
         * instruction register
         * */
        cpu.IR = null;
        /**
         * status registers
         * */
        cpu.SRS = {};

        /**
         * global variable registers
         * */
        cpu.GVGS = {};

        var stack = {};

        stack.frames = [];

        /**
         * 放入一条待执行的指令
         *
         * */

        stack.push = function (ins) {

            if (cpu.SRS.exited) {
                return null;
            }

            ins.ctx(cpu);

            var frames = this.frames;
            var i = 0;
            while (0 === 0) {
                if (i > MAX_CALL_STACK_SIZE) {
                    cpu.exit(new Error("Max call stack size!"));
                    return false;
                }

                if (frames[0] && frames[0].slice != undefined) {

                    frames = frames[0];
                } else {
                    frames.push(ins);
                    break;
                }
                i++;
            }

            return true;
        };
        /**
         * 返回下一条待执行的指令
         * */
        stack.nextInstruction = function () {

            if (cpu.SRS.exited) {

                cpu.IR = null;

                return null;

            }
            /**
             * 嵌入临时子指令
             * */
            var frame = this.frames;
            var i = 0;
            var ins = null;

            /**
             * 寻找下一条待执行的指令
             * */
            while (0 === 0) {

                if (i > MAX_CALL_STACK_SIZE) {
                    cpu.exit(new Error("Max call stack size!"));
                    return false;
                }

                if (frame === null) {
                    break;
                }

                if (frame.length > 0 && Array.isArray(frame[0])) {

                    frame[0]._parent = frame;
                    frame = frame[0];

                } else {

                    if (frame.length === 0) {

                        if (frame._isloop) {

                            ins = frame._ins;
                        }

                        if (frame._parent != null) {

                            /**
                             * 释放上一个函数的栈帧
                             * */
                            frame._parent.shift();
                            frame = frame._parent;

                        } else {
                            /**
                             * no more instructions
                             * */
                            break;
                        }

                        if (ins != null) {
                            break;
                        }

                    } else {
                        ins = frame.shift() || null;
                        break;
                    }
                }

                i++;
            }

            if (frame != null && ins != null) {
                /**
                 *
                 * 为下一条指令创建栈帧
                 * */
                var sub_frame = [];

                /**
                 * 对循环指令的特殊操作
                 * */
                if (ins._type === insType.loop) {

                    sub_frame._ins = ins;
                    sub_frame._isloop = true;
                    sub_frame._parent_loop = cpu.SRS.current_loop;

                    cpu.SRS.current_loop = sub_frame;

                }

                frame.unshift(sub_frame);
            }

            cpu.IR = ins;

            return ins;
        };

        cpu.stack = stack;

        /**
         * 退出当前的循环
         * */
        cpu.breakCurrentLoop = function () {

            var loop = cpu.SRS.current_loop;

            if (loop) {
                /**
                 * 重设当前正在运行的loop
                 * */
                cpu.SRS.current_loop = loop._parent_loop;

                /**
                 * 清空即将跳出的loop
                 * */
                loop.length = 0;
                loop._isloop = false;
            }

        };

        /**
         * 执行一条指令
         * */
        cpu.runInstruction = function (ins) {

            if (ins._type !== insType.async) {
                try {
                    ins._setResult(ins._run());
                } catch (e) {
                    cpu.exit(e);
                }

            } else {
                try {
                    ins._run();
                } catch (e) {
                    cpu.exit(e);
                }
            }
        };

        /**
         * 重启当前运行时
         * */
        cpu.resume = function (result) {

            if (cpu.IR) {
                cpu.IR._setResult(result);
            }

            run();
        };

        cpu.exit = function (err, result) {
            if (!cpu.SRS.exited) {
                cpu.SRS.exited = true;
                /**
                 * 清空指令序列
                 * */
                cpu.stack.frames = [];

                if (cpu.SRS.handler) {
                    cpu.SRS.handler(err, result);
                } else if (err) {
                    throw err;
                }
            }
        };

        function exec(instruction) {

            var ins = null;

            if (isFuture(instruction)) {

                ins = new Instruction(instruction, insType.async);
                ins._args = [_resume];
                ins._is_future = true;

            } else if (instruction instanceof Instruction) {
                ins = instruction;
            } else if ("function" === typeof instruction) {
                ins = new Instruction(instruction, insType.normal);
            } else {
                throw new TypeError("Wrong type, Can't exec this!");
            }

            cpu.stack.push(ins);

            var func = function () {
                !ins._is_future && (ins._args = [].slice.call(arguments));
            };

            func.assign = function (name) {
                ins.assign(name);
                return func;
            };
            func._ins = ins;

            return func;
        }

        exec.for  = function (turn) {
            if ("function" != typeof turn) {
                throw new TypeError("Wrong type, Can't exec this!");
            }
            var ins = new Instruction(turn, insType.loop);
            cpu.stack.push(ins);
        };
        exec.break = function () {

            var ins = new Instruction(function () {
                cpu.breakCurrentLoop();
            }, insType.break);

            cpu.stack.push(ins);
        };

        exec.async = function (instruction) {

            if ("function" != typeof instruction) {

                throw new TypeError("Wrong type, Can't exec this!");
            }

            var ins = new Instruction(instruction, insType.async);

            cpu.stack.push(ins);

            var func = function () {
                ins._args = [].slice.call(arguments);
            };

            func.assign = function (name) {
                ins.assign(name);
                return func;
            };

            func._ins = ins;

            return func;
        };

        exec.return  = function () {

            var result = [].slice.call(arguments);

            var ins = new Instruction(function () {
                var temp = [];
                for (var i = 0; i < result.length; i++) {

                    if (result[i] && ("function" === typeof result[i]) && (result[i]._ins instanceof Instruction)) {
                        temp[i] = result[i]._ins.result();
                    } else {
                        temp[i] = result[i];
                    }

                }
                cpu.exit(null, temp);
            }, insType.normal);

            cpu.stack.push(ins);

        };

        function _resume() {
            cpu.resume([].slice.call(arguments));
        }


        function run() {

            var ins = cpu.stack.nextInstruction();

            if (!ins) {

                return cpu.exit();

            }

            if (insType.async === ins._type) {
                /**
                 *  异步操作
                 * */
                return cpu.runInstruction(ins);

            } else {
                cpu.runInstruction(ins);
            }

            /**
             * tail call
             * */
            return run();
        }

        var running = false;

        function future(handler) {

            if (running) {
                throw new Error("Already running");
            }

            running = true;

            if (handler) {
                if ("function" != typeof handler) {
                    throw TypeError("The handler must be a function!");
                }

                cpu.SRS.handler = handler;
            }
            var error = null;

            try{

                func(exec, cpu.GVGS, _resume);

            }catch (e){
                error = e;
            }

            if(error === null){
                run();
            }else {
                cpu.exit(error);
            }

        }

        future._runtime_cpu = true;

        return future;
    }

    try {

        module.exports = cc;

    } catch (e) {}

    try {

        window.cc = cc;

    } catch (e) {}
})();