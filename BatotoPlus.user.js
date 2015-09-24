// ==UserScript==
// @id             JustJustin.BatotoPlus
// @name           Batoto Plus
// @version        1.0
// @namespace      JustJustin
// @author         JustJustin
// @description    Adds new features to Batoto
// @include        http://www.batoto.net/read/*
// @include        http://www.bato.to/read/*
// @include        http://bato.to/read/*
// @include        http://bato.to
// @downloadURL    https://github.com/JustJustin/BatotoPlus/raw/master/BatotoPlus.user.js
// @run-at         document-end

// ==/UserScript==

//keyCodes 65=a... Little test to fill out keyCodes
var keycode = {};
function charfill(ch, code, lim){
	for(var i = 0; i < lim; ++i)
		keycode[String.fromCharCode(ch.charCodeAt()+i)] = code+i;
}
charfill('a', 65, 26); charfill('0', 48, 10);

function next(){
	window.location = document.getElementById('comic_page').parentNode.href;
}

function prev(){
	window.history.back();
}

var scrollInterval = null;
var myKeyHandler = function(e){
	if(e.target.nodeName == 'INPUT') return;
	switch(e.keyCode){
		case keycode.a:
			prev();
			break;
		case keycode.d:
			next();
			break;
		case keycode.w:
			if (scrollInterval === null) {
				window.scrollBy(0, -57);
				scrollInterval = setInterval(function () {
					window.scrollBy(0, -35);
				}, 30);
			}
			break;
		case keycode.s:
			if (scrollInterval === null) {
				window.scrollBy(0, 57);
				scrollInterval = setInterval(function () {
					window.scrollBy(0, 35);
				}, 30);
			}
			break;
	}
	return;
}
var myKeyUp = function(e) {
	switch (e.keyCode) {
		case keycode.w:
		case keycode.s:
			if (scrollInterval !== null) {
				clearInterval(scrollInterval);
				scrollInterval = null;
			}
			break;
	}
}


if (/\/read\//.exec(window.location.pathname)) {
    // If on a read page, ie manage page.
    // Handle scroll events
    document.body.addEventListener('keydown', myKeyHandler);
    document.body.addEventListener("keyup", myKeyUp);

    var content = document.querySelector("#content");
    if (content) {
        var zoom_notice = document.querySelector("#zoom_notice");
        if (zoom_notice) {
			// If zoom notice is div is here, image is large, adjust positioning to better fill space.
            var img_div = document.querySelector("#comic_wrap>div>a").parentNode;
            img_div.style.right = "0px";
            img_div.style.top = "0px";
            img_div.querySelector("img").style.width = "";

            // Stop adjust_page_width from ruining our resize.
            var s = document.createElement("script");
            s.type = "text/javascript";
            s.innerHTML = "function adjust_page_width() {console.log(\"MyAdjust\"); return;}";
            document.head.appendChild(s);
        }
    }
}
