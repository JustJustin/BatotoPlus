// ==UserScript==
// @id             JustJustin.BatotoPlus
// @name           Batoto Plus
// @version        1.3.4
// @namespace      JustJustin
// @author         JustJustin
// @description    Adds new features to Batoto
// @include        http://bato.to
// @include        https://bato.to
// @include        http://bato.to/*
// @include        https://bato.to/*
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
    if ($js('#comic_page')) {
        window.location = $js('#comic_page').parentNode.href;
    } else if ($js(".moderation_bar ul img[title=\"Next Chapter\"]")) {
        window.location = $js(".moderation_bar ul img[title=\"Next Chapter\"]").parentNode.href;
    } else {
        // There appears to be nothing here we should maybe go to the comic page? TODO
        
    }
}
function prev(){
    // TODO make smart
	window.history.back();
}

/* Manga Cache
   Caches manga info
 */
var mangaCacheKey = "mangaCache";
if (!(mangaCacheKey in window.localStorage)) {
    window.localStorage[mangaCacheKey] = JSON.stringify({});
}
function getMangaID (url) {
    if (url.contains("/comics/")) {
        var parts = url.split("/");
        var part = "";
        for (var i = 0; i < parts.length; ++i) {
            part = parts[i];
            if (part == "comics") {
                part = parts[i+1];
                break;
            }
        }
        if (part.lastIndexOf("r") == -1) {return "";}
        return part.substr(part.lastIndexOf("r")+1);
    }
    return "";
}

function getMangaCache() {
    return JSON.parse(window.localStorage[mangaCacheKey]);
}
function saveMangaInfo(id, info) {
    if (info.id == "") {
        info.id = id;
    } else if(info.id != id) {
        console.log({msg:"Error: Manga IDs do not match in saveMangaInfo.", id: id, info: info});
        alert("Error: Trying to save manga id " + id + " with non-matching info.id " + info.id);
        return;
    }
    var cache = getMangaCache();
    cache[id] = info;
    window.localStorage[mangaCacheKey] = JSON.stringify(cache);
}
function getMangaInfo(id) {
    var cache = getMangaCache();
    if (id in cache) {
        return cache[id];
    }
    return false;
}

function parseMangaPage(doc, url=undefined) {
    var getInfoColumn = function(infoLabel, init=undefined, clean=true) {
        var $tds = $$js("tbody>tr>td:first-child", doc);
        for (var j = 0; j < $tds.length; ++j) {
            if ($tds[j].innerHTML == infoLabel) {
                var el = $tds[j].parentNode.children[1];
                return (clean ? el.textContent : el.innerHTML);
            }
        }
        return init;
    };
    var info = {};
    info.title = $js(".ipsType_pagetitle", doc).innerHTML.trim();

    info.status = getInfoColumn("Status:", "Unknown");
    info.description = getInfoColumn("Description:", "Unknown", false);    
    info.author = getInfoColumn("Author:", "Unknown");
    info.artist = getInfoColumn("Artist:", "Unknown");
    info.type = getInfoColumn("Type:", "Unknown");
    
    var getInfoListValues = function(infoLabel, init=[]) {
        var $tds = $$js("tbody>tr>td:first-child", doc);
        for (var j = 0; j < $tds.length; ++j) {
            if ($tds[j].innerHTML == infoLabel) {
                var listContainer = $tds[j].parentNode.children[1];
                var alts = $$js("span>img", listContainer);
                var values = [];
                for (var i = 0; i < alts.length; ++i) {
                    values.push(alts[i].parentNode.textContent.trim());
                }
                return values;
            }
        }
        return init;
    }

    info.alt_names = getInfoListValues("Alt Names:"); // handle later
    info.genres = getInfoListValues("Genres:"); // handle later
    if (url) {
        info.id = getMangaID(url);
    } else {
        info.id = "";
    }
    if ($js(".ipsBox>div>div>img")) {
        info.img_src = $js(".ipsBox>div>div>img").src;
    } else {
        console.log({msg:"Couldn't find manga page image.", dom:doc, info:info});
        // some placeholder image?
        info.img_src = "";
    }
    return info;
}

/* New chapter read db
 * Always pushes a web update if we add a 'new' entry to the db.
 * checkForUpdate provides a mechanism for updating from web every hour.
 * WiP
 */
function chReadDB() {
    this.chReadKey = "chStatus";
    this.updateKey = "chStatusLastUpdate";
    this.webConfigKey = "chStatusWebConfig";
    /* Configuration for updating web db on remote site.
     * {url: url to submission page, key: dbkey, 
     *  pass: password, interval: time in minutes between autoupdates}
     * For no webdb:
     * this.webConfig = false; 
     */
    this.webConfig = false;
    if ((this.webConfigKey in window.localStorage)) {
        this.webConfig = JSON.parse(window.localStorage[this.webConfigKey]);
    }

    // Initialize localStorage keys if necessary
    if (!(this.updateKey in window.localStorage)) {
        window.localStorage[this.updateKey] = new Date(0).toJSON();
    }
    if (!(this.chReadKey in window.localStorage)) {
        window.localStorage[this.chReadKey] = JSON.stringify({});
    }
    this.db = JSON.parse(window.localStorage[this.chReadKey]);

    this.reload = function() {
        var newDB = JSON.parse(window.localStorage[this.chReadKey]);
        // Run handler if new key was loaded.
        for (var key in newDB) {
            if (!(key in this.db)) {
                this.db = newDB;
                if (this.onUpdate) {this.onUpdate();}
                return;
            }
        }
        this.db = newDB;
    };
    this.save = function() {
        window.localStorage[this.chReadKey] = JSON.stringify(this.db);
    };
    this.status = function(hash) {
        hash = this.cleanHash(hash);
        this.reload();
        if (this.db[hash]) {
            return this.db[hash];
        }
        return false;
    };
    this.cleanHash = function(hash) {
        // cleans hash
        if (/_[0-9]{1,4}$/.exec(hash)) {
            hash = hash.substr(0, /_[0-9]{1,4}$/.exec(hash).index);
        }
        return hash;
    };
    this.clean = function() {
        // Cleans all keys in the db
        this.reload();
        for (var key in this.db) {
            if (/_[0-9]{1,4}$/.exec(key)) {
                var newkey = key.substr(0, /_[0-9]{1,4}$/.exec(key).index);
                if (!(newkey in this.db)) {
                    this.db[newkey] = 1;
                }
                delete this.db[key];
            }
        }
        this.save()
    };
    this.update = function() {
        if (this.webConfig) {
            this.reload();
            var params = "db=" + this.webConfig.key + 
                         "&pass=" + this.webConfig.pass + 
                         "&data=" + JSON.stringify(this.db);
            var req = new XMLHttpRequest();
            req.open("POST", "http://game.kiri.moe/manga/index.php");
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            req.send(params);
            req.readDB = this;
            req.onload = function (e) {
                this.readDB.merge(this.response);
                window.localStorage[this.readDB.updateKey] = new Date().toJSON();
                console.log("CHDB Updated");
            }
            req.onerror = function (e) {
                console.log({msg:"Error updating CHDB", request:this});
            }
            console.log("Sending CHDB");
        } else {
            window.localStorage[this.updateKey] = new Date().toJSON();
        }
    };
    this.checkForUpdate = function() {
        if (this.webConfig) {
            var last_update = new Date(window.localStorage[this.updateKey]);
            var elapsed_minutes = (new Date() - last_update) / 1000 / 60;
            if (elapsed_minutes > this.webConfig.interval) {
                this.update();
            }
        }
    };
    this.merge = function(dbJSON) {
        var newKey = false;
        var newDB = JSON.parse(dbJSON);
        this.reload();
        for (var key in newDB) {
            key = this.cleanHash(key);
            if (!(key in this.db)) {
                newKey = true;
                console.log("Adding key" + key);
                this.db[key] = 1;
            }
        }
        this.save();
        if (newKey && this.onUpdate) {this.onUpdate();}
    };
    this.set = function(hash) {
        hash = this.cleanHash(hash);
        if (!this.status(hash)) {
            this.db[hash] = 1;
            this.save();
            this.update();
            if (this.onUpdate) {this.onUpdate();}
        }
    };
    // Event Handler for making page changes on readdb update.
    this.onUpdate = null;
    // Do check in constructor; should run once per page load
    this.checkForUpdate(); 
}

var readDB = new chReadDB();

// Get url hash, useful for getting hashid from chapter links
function gethash (url) {
    if (url.lastIndexOf("#") == -1) {
        return false;
    }
    return url.substr(url.lastIndexOf("#"));
}

if (unsafeWindow) {
    unsafeWindow.BP = {};
    unsafeWindow.BP.readDB = readDB;
    unsafeWindow.BP.mergechdb = readDB.merge;
    unsafeWindow.BP.cleanchdb = readDB.clean;
    unsafeWindow.BP.promptchdb = function () {
        window.prompt("chreaddb", window.localStorage[readDB.chReadKey]);
    };
    unsafeWindow.BP.updatechdb = readDB.update;

    // Make my jslib available, useful for development/debugging.
    unsafeWindow.$js = $js;
    unsafeWindow.$$js = $$js;
}

function savechhash() {
    // assumed to be on a reader page
    var hashid = window.location.hash;
    if (/_[0-9]{1,4}$/.exec(hashid)) {
        hashid = window.location.hash.substr(0, /_[0-9]{1,4}$/.exec(hashid).index);
    }
    console.log("Saving chapter status " + hashid);
    readDB.set(hashid);
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
            if (readDB.status(chhash)) {
                // mark green
                entry.children[0].style["background-color"] = "green";
            } else {
                // Do nothing for now
            }
        }
    }
}
function markcomicchstatus() {
    var entries = $$js("table.chapters_list tr.chapter_row");
    for (var i = 0; i < entries.length; ++i) {
        var entry = entries[i];
        var a = $js("td>a", entry);
        if (!a) {continue;}
        var chhash = gethash(a.href);
        if (readDB.status(chhash)) {
            // visited
            entry.style["background-color"] = "lightgreen";
        }
    }
}
function marksidebarchstatus() {
    // My follows list
    var entries = $$js("#hook_watched_items div.recent_activity li");
    for (var i = 0; i < entries.length; ++i) {
        var entry = entries[i];
        var a = $js("a>img", entry);
        if (!a) {continue;}
        a = a.parentNode;
        var chhash = gethash(a.href);
        if (readDB.status(chhash)) {
            // visited
            entry.children[0].style["background-color"] = "lightgreen";
        }
    }
}

var keyTimeout = null;
var scrollInterval = null;
var myKeyHandler = function(e){
	if(e.target.nodeName == 'INPUT') return;

    if (keyTimeout !== null) clearTimeout(keyTimeout);
    keyTimeout = setTimeout(function() {
        if (scrollInterval !== null) {
            clearInterval(scrollInterval); 
            scrollInterval = null
        } 
        keyTimout=null;
    }, 500);
    
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

function allMyFollows() {
    // Settings
    var useCacheIfCompleted = true;
    var useCacheForAll = false;

    // For the allMyFollows section on the myfollows page.
    var $header = $$js("h3.maintitle")[1];
    var $follows = $$js("div#content>div>div>a");
    var $button = $js.el("button", {type:"button", innerHTML: "Check Status"});
    $button.style["margin-left"] = "5px";
    $header.appendChild($button);

    var $optionSpan = $js.el("span"); $optionSpan.style.margin = "8px";
    var $checkBox = $js.el("input", {id:"BP_cache1", type:"checkbox", checked:useCacheIfCompleted});
    var $label = $js.el("label", {innerHTML: "Use Cache for Completed Follows"});
    $label.setAttribute("for", "BP_cache1");
    $checkBox.onclick = function () {
        useCacheIfCompleted = this.checked;
    }
    $checkBox.style.margin="5px";
    $optionSpan.appendChild($checkBox);
    $optionSpan.appendChild($label);
    
    $checkBox = $js.el("input", {id:"BP_cache2", type:"checkbox", checked:useCacheForAll});
    $label = $js.el("label", {innerHTML: "Use cache for all Follows"});
    $label.setAttribute("for", "BP_cache2");
    $checkBox.onclick = function() {
        useCacheForAll = this.checked;
    }
    $checkBox.style.margin="5px";
    $optionSpan.appendChild($checkBox);
    $optionSpan.appendChild($label);

    $header.appendChild($optionSpan);
    
    var cancelled = false;
    var i = 0;
    
    var startFollows = function () {
        console.log("Beginning to check allMyFollows Status");
        window.alert("This is a slow process, it appears Batoto slows requests for series pages like this.\nPlease leave this tab open and wait for the process to complete.")
        $button.onclick = function () {};
        $button.disabled = true;
        $button.innerHTML = "Checking...";
        nextFollow();
        nextFollow();
    };

    var handleInfo = function(el, info) {
        // Fills out link container with manga info.
        var $parent = el;
        $parent.appendChild($js.el("br"));
        $parent.appendChild($js.el("span", {innerHTML: "Status: " + info.status}));
        $parent.appendChild($js.el("br"));
        $parent.appendChild($js.el("span", {innerHTML: "Description: " + info.description}));
        $parent.appendChild($js.el("br"));
        
        $parent.style["display"] = "block";
        $parent.style["background-color"] = "#eeffff";
        $parent.style["margin-bottom"] = "7px";
        $parent.style["padding-top"] = "6px";
        $parent.children[0].style["font-size"] = "2em";
        var name = $parent.children[0].innerHTML;
        var malurl = "http://myanimelist.net/manga.php?q=" + name;
        $parent.appendChild($js.el("span", {innerHTML:"<a href='"+malurl+"' target='_blank'>MAL Search</a>"}));
        $parent.appendChild($js.el("br"));
    };

    var nextFollow = function() {
        if (i >= $follows.length) {
            $button.innerHTML = "DONE";
            return; //DONE! (Mark button)
        }
        var $a = $follows[i++];
        var href = $a.href;

        if (useCacheForAll || useCacheIfCompleted) {
            var id = getMangaID(href);
            var info = getMangaInfo(id);

            if ((useCacheForAll && info) || 
                (useCacheIfCompleted && info && info.status == "Complete") ) {
                console.log({msg:"Using Cached Manga Info", id:id, info:info, 
                             settings: {useCacheIfCompleted:useCacheIfCompleted, 
                                        useCacheForAll: useCacheForAll}
                            });
                handleInfo($a.parentNode, info);
                return nextFollow();
            }
        }

        var req = new XMLHttpRequest();
        req.open("GET", href);
        req.el = $a.parentNode;
        req.responseType = "document";
        req.onload = function (e) {
            var $dom = this.response;
            var info = parseMangaPage($dom, this.responseURL);
            saveMangaInfo(info.id, info);
            console.log({msg:"Finished manga page request.", title:info.title, info:info});
            
            handleInfo(this.el, info);
            nextFollow();
        };
        req.send();
    };
    $button.onclick = startFollows;
}

function reader_page(mutations, instance) {
    if ($js("#reader>.suggested_title")) {
        return;
    }
    
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
    if ($js("#comic_page")) {
        $js.extend( $js("#comic_page").parentNode.parentNode.style,
                    { top: "0px", marginBottom: "0px", right: "0px" }
                  );
    }
    var title = $js("#content div.moderation_bar > ul > li:first-child a").innerHTML;
    title = title.replace(/ /g, "-");
    title = title.replace(/[\':]/g, "");
    
    var ch_select = $js("#content div.moderation_bar > ul > li:nth-child(2) select");
    var ch = ch_select.options[ch_select.selectedIndex].innerHTML;
    ch = getch(ch);
    if (ch.length < 2) ch = "0"+ch;
    
    var page_select = $js("#content div.moderation_bar > ul select#page_select");
    if (!page_select) {
        // No pages... maybe multiple images?
        // This is usually webcomics/4komas
        var $bot = $$js("div.moderation_bar")[1];
        var $el = $js.el("div", {class: "suggested_title"});
        $el.style.textAlign = "center";

        title = title + "_c"+ ch;

        var imgs = $$js("#reader>div>img");
        for (var i = 0; i < imgs.length; ++i) {
            // Create holder; this preserves order of requests.
            var $span = $js.el("span");
            $el.appendChild($span);

            // create a data blob of these images
            var type = imgs[i].src.split(".").pop();
            var req = new XMLHttpRequest();
            req.open("GET", "//cors-anywhere.herokuapp.com/" + imgs[i].src);
            req.responseType = "arraybuffer";
            req.filetype = type;
            req.i = i;
            req.span = $span;
            req.onload = function (event) {
                var type = this.filetype;
                var data = new Blob([this.response], {type: "image/" +
                                                      (type == "jpg" ? "jpeg" : type)});
                
                var pg = this.i+1;
                var pg_str = (imgs.length == 1 ? "" : 
                              (imgs.length > 9 && pg <= 9 ? "p0"+pg : "p"+pg));
                var $a = $js.el("a", {href: window.URL.createObjectURL(data),
                                      download: title + pg_str + "." + type,
                                      innerHTML: title + pg_str});
                this.span.appendChild($a);
                this.span.appendChild($js.el("br"));
            };
            req.send();
        }
        $js.after($bot, $el);
        return;
    }
    // Pages... regular manga
    var pg = page_select.options[page_select.selectedIndex].innerHTML;
    pg = /[\d]+/.exec(pg)[0];
    if (page_select.options.length > 9 && pg.length < 2) pg = "0"+pg;
    
    var name = title + "_c" + ch + "p" + pg;
    console.log("Recommended name is " + name);

    
    var $bot = $$js("div.moderation_bar")[1];
    var $el = $js.el("div", {class: "suggested_title"});
    
    if ($js("#comic_page")) {
        var img = $js("#comic_page");
        var type = img.src.split(".").pop();
        var req = new XMLHttpRequest();
        req.open("GET", "//cors-anywhere.herokuapp.com/" + img.src);
        req.responseType = "arraybuffer";
        req.onload = function (event) {
            var data = new Blob([this.response], {type: "image/" +
                                                  (type == "jpg" ? "jpeg" : type)});
            var $a = $js.el("a", {href:window.URL.createObjectURL(data),
                                  download: name + "." + type,
                                  innerHTML: name});
            $el.appendChild($a);
        };
        req.send();
    } else {
        $el.innerHTML = name;
    }

    $el.style.textAlign = "center";
    $js.after($bot, $el);
}

if (/\/reader/.exec(window.location.pathname)) {
    console.log("Reader Page");
    var $reader = $js("#reader");
    var observer = new MutationObserver( reader_page );
    observer.observe($reader, {childList: true, attributes: false, characterData: false});

} else {
    if (/\/myfollows/.exec(window.location.pathname)) {
        // my follows page
        console.log("Follows page");
        markchstatus();
        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) {
                readDB.checkForUpdate();
                markchstatus();
            }
        });
        allMyFollows();
    }

    if (/\/comics/.exec(window.location.pathname)) {
        // A manga page
        console.log("Manga Page");
        var mangaID = getMangaID(window.location.pathname);
        var mangaInfo = parseMangaPage(document);
        saveMangaInfo(mangaID, mangaInfo);
        console.log({msg:"Parsed Manga Page", id:mangaID, info:mangaInfo});

        markcomicchstatus();
    }

    if ($js("#hook_watched_items")) {
        marksidebarchstatus();
        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) {
                readDB.checkForUpdate();
                marksidebarchstatus();
            }
        });
    }
    
    // Not read page, front page?
    if ($js("#index_stats")) {
        /* These move the watched manga tab above the notices div */
        $js.prepend($js("#index_stats"), $js("#hook_watched_items"));
        /* This remove a stupid seperator image */
        if ($js(".category_block>img")) {
            $js.remove($js(".category_block>img"));
        }
    }

    /* Allow watched to apear bigger */
    if ($js("#hook_watched_items")) {
        $js("#hook_watched_items>div").style.maxHeight = '600px';
    }
}
