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

var $base;
$base = function(selector, root){
    if(root == null) {
        root = document.body;
    }
    return root.querySelector(selector);
};
$$base = function(selector, root){
    if(root == null) {
        root = document.body;
    }
    return root.querySelectorAll(selector);
};
$base.extend = function(object, data){
    var key, val;
    for(key in data){
        val = data[key];
        object[key] = val;
    }
};
var $js = $base;
var $$js = $$base;

$base.extend($base, {
    engine: /WebKit|Presto|Gecko/.exec(navigator.userAgent)[0].toLowerCase(),
    addClass: function(el, klass){
        el.classList.add(klass);
    },
    rmClass: function(el, klass){
        el.classList.remove(klass);
    },
    hasClass: function(el, klass){
        var i;
        for(i = 0; i < el.classList.length; ++i){
            if(el.classList[i] == klass){
                return true;
            }
        }
        return false;
    },
    id: function(id) {
        return document.getElementById(id);
    },
    attr: function(el, val) {
        var attributes = el.attributes;
        return (attributes[val] === undefined) ? false: attributes[val].value;
    },
    after: function(root, el) {
        if(root.nextSibling){
            return root.parentNode.insertBefore(el, root.nextSibling);
        }
        return root.parentNode.appendChild(el);
    },
    before: function(root, el) {
        return root.parentNode.insertBefore(el, root);
    },
    space: function(el) {
        el.appendChild(document.createTextNode(' '));
    },
    el: function(tagname, attrs) {
        var el = document.createElement(tagname);
        if(attrs == undefined) {
            attrs = {};
        }
        $base.extend(el, attrs);
        if(attrs['class']) {
            el.className = attrs['class'];
        }
        return el;
    },
    indexIn: function(array, object) {
        var index = -1;
        for(var i = 0; i < array.length; ++i) {
            if(array[i] > object) {
                index = i;
                break;
            }
        }
        return index;
    },
    firstParent: function(root, tag, limit) {
        if(limit === 0) { return false; }
        if( root.parentNode.tagName.toLowerCase() == tag.toLowerCase() ) {
            return root.parentNode;
        }
        if(root.parentNode == document.body){
            return false;
        }
        return $base.firstParent(root.parentNode, tag, limit - 1);
    },
    remove: function(el) {
        return el.parentNode.removeChild(el);
    },
    log: function(obj, severe) {
        if(severe || config.debug) {
            console.log(obj); //This is going to fuck up horribly with regular firefox I think
            //TODO FIX ^^^
        }
    },
    prepend: function(base, el) {
        if(base.firstChild) {
            $base.before(base.firstChild, el);
        } else {
            base.appendChild(el);
        }
    },
    addStyle: function(css) {
        var style;
        style = $base.el('style', {
            textContent: css
        });
        document.head.appendChild(style);
        return style;
    }
});

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

/* The following is a list of the functions used to track ch read status */
chreadkey = "chStatus";
// Get url hash, useful for getting hashid from chapter links
function gethash (url) {
    if (url.lastIndexOf("#") == -1) {
        return false;
    }
    return url.substr(url.lastIndexOf("#"));
}
// Returns if the chapter from the passed hashid has been visited.
function chreadstatus(hash) {
    if (chreadkey != window.localStorage.key(chreadkey)) {
        return false;
    }
    if (window.localStorage[chreadkey][hash]) {
        return window.localStorage[chreadkey][hash];
    }
    return false;
}
function savechhash() {
    // assumed to be on a reader page
    var hashid = window.location.hash;
    if (chreadkey != window.localStorage.key(chreadkey)) {
        window.localStorage[chreadkey] = {};
    }
    window.localStorage[chreadkey][hashid] = 1;
}
function markchstatus() {
    // Assumed to be on my follows page
    var entries = document.querySelectorAll("table.chapters_list>tbody>tr");
    if (entries) {
        // pop off header
        entries = Array.slice(entries, 1);
        for (var i = 0; i < entries.length; ++i) {
            var entry = entries[i];
            var ch = entry.children[1].children[1];
            var chhash = gethash(ch.href);
            if (chreadstatus(chhash)) {
                // mark green
                entry.children[0].style["background-color"] = "green";
            } else {
                // Do nothing for now
            }
        }
    }
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

function repositionLargeImages() {
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
function re_results(re, str) {
    // returns an array containing every match object for the regex in str
    var results = [];
    var result;
    while ((result = re.exec(str)) !== null) {
        results.push(result);
    }
    return (!results.length) ? null : results;
}
function getch(name) {
    // Try's to get the most likely number to be the chapter in the chapter select
    var re = /[\d]+(\.[\d]+)?/gi;
    var res = re_results(re, name);
    console.log(res);
    if (res) {return res[res.length-1][0];}
    else {return null;}
}

if (/\/read\//.exec(window.location.pathname)) {
    // If on a read page, ie manga page.
    // Handle scroll events
    document.body.addEventListener('keydown', myKeyHandler);
    document.body.addEventListener("keyup", myKeyUp);
    
    savechhash();

    repositionLargeImages();
    
    /* Remove ad blocker image */
    if ($js("#topa")) {
        $js("#topa").remove();
    }
    /* Move comic image up */
    $js.extend( $js("#comic_page").parentNode.parentNode.style,
                  { top: "0px", marginBottom: "0px", right: "0px" }
                );
    var title = $js("#content div.moderation_bar > ul > li:first-child a").innerHTML;
    title = title.replace(/ /g, "-");
    
    var ch_select = $js("#content div.moderation_bar > ul > li:nth-child(2) select");
    var ch = ch_select.options[ch_select.selectedIndex].innerHTML;
    ch = getch(ch);
    if (ch.length < 2) ch = "0"+ch;
    
    var page_select = $js("#content div.moderation_bar > ul select#page_select");
    var pg = page_select.options[page_select.selectedIndex].innerHTML;
    pg = /[\d]+/.exec(pg)[0];
    if (page_select.options.length > 9 && pg.length < 2) pg = "0"+pg;
    
    var name = title + "_c" + ch + "p" + pg;
    console.log("Recommended name is " + name);
    
    var $bot = $$js("div.moderation_bar")[1];
    var $el = $js.el("div", {innerHTML: name});
    $el.style.textAlign = "center";
    $js.after($bot, $el);
} else {
    if (/\/myfollows/.exec(window.location.pathname)) {
        // my follows page
        console.log("Follows page");
        markchstatus();
    }

    // Not read page, front page?
    
    if ($js("#index_stats")) {
        /* These move the watched manga tab above the notices div */
        $js.prepend($js("#index_stats"), $js("#hook_watched_items"));
        /* This remove a stupid seperator image */
        $js.remove($js(".category_block>img"));
    }

    /* Allow watched to apear bigger */
    if ($js("#hook_watched_items")) {
        $js("#hook_watched_items>div").style.maxHeight = '600px';
    }
}
