const timeFormat = function(dt = "", fmt = "yyyy-MM-dd hh:mm:ss:S") {
    let date;
    if (dt) {
        date = dt;
    } else {
        let timezone = 8;
        let offset_GMT = new Date().getTimezoneOffset();
        let nowDate = new Date().getTime();
        date = new Date(nowDate + offset_GMT * 60 * 1e3 + timezone * 60 * 60 * 1e3);
    }
    let o = {
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "h+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
        "q+": Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    Object.keys(o).forEach(k => {
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] + "" : ("00" + o[k]).substr(("" + o[k]).length));
    });
    return fmt;
};

module.exports = {
    timeFormat: timeFormat
};