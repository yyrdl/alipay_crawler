/**
 * Created by jason on 2017/12/20.
 */
function Post(json, url, callback) {
    var request,
        response = null,
        err = null;

    function _end(err, res) {

        callback && (callback(err, res));
    }
    if (window.XMLHttpRequest) {
        request = new XMLHttpRequest();
    } else
    if (window.ActiveXObject) {
        request = new ActiveXObject('Microsoft.XMLHTTP');
    } else {
        alert('Sorry! Your browser does not support Ajax!');
        return;
    }
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            try {
                response = JSON.parse(request.responseText);
            } catch (e) {
                err = e;
            }
            _end(err, response);
        } else if (request.readyState === 4 && request.status != 0) {
            err = new Error("HTTP ERROR! STATUS:" + request.status);
            err.name = "HTTP ERROR";
            _end(err, response);
        }
    }
    request.open('POST', url);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(toString(json));
    request.onerror = function (err) {
        err = new Error("HTTP ERROR! IS SERVER ONLINE?");
        err.name = "HTTP ERROR";
        _end(err, response);
    }
}
function Get(url, callback) {
    var request,
        response = null,
        err = null;
    
    function _end(err, res) {

        callback && (callback(err, res));
    }
    if (window.XMLHttpRequest) {
        request = new XMLHttpRequest();
    } else
    if (window.ActiveXObject) {
        request = new ActiveXObject('Microsoft.XMLHTTP');
    } else {
        alert(' Sorry! Your browser does not support Ajax! ');
    }
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            try {
                response = JSON.parse(request.responseText);
            } catch (e) {
                err = e;
            }
            _end(err, response);
        } else if (request.readyState === 4 && request.status != 0) {
            err = new Error("HTTP ERROR! STATUS:" + request.status);
            err.name = "HTTP ERROR";
            _end(err, response);
        }
    };
    request.open('GET', url);
    request.send(null);
    request.onerror = function (err) {
        err = new Error("HTTP ERROR! IS SERVER ONLINE?");
        err.name = "HTTP ERROR";
        _end(err, response);
    }
}