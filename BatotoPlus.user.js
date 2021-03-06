// ==UserScript==
// @id             JustJustin.BatotoPlus
// @name           Batoto Plus
// @version        1.6.0
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
    css: function(el, css) {
        $base.extend(el.style, css);
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
$base.extend(keycode, {'up': 38, 'down': 40});

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
    if ($js(".moderation_bar ul img[title=\"Previous Page\"]")) {
        window.location = $js(".moderation_bar ul img[title=\"Previous Page\"]").parentNode.href;
    } else if ($js(".moderation_bar ul img[title=\"Previous Chapter\"]")) {
        window.location = $js(".moderation_bar ul img[title=\"Previous Chapter\"]").parentNode.href;
    } else {
	    window.history.back();
    }
}
function next_chapter() {
    if ($js(".moderation_bar ul img[title=\"Next Chapter\"]")) {
        window.location = $js(".moderation_bar ul img[title=\"Next Chapter\"]").parentNode.href;
    }
}
function prev_chapter() {
    if ($js(".moderation_bar ul img[title=\"Previous Chapter\"]")) {
        window.location = $js(".moderation_bar ul img[title=\"Previous Chapter\"]").parentNode.href;
    }
}

/* Manga Cache
   Caches manga info
 */
var mangaCacheKey = "mangaCache";
if (!(mangaCacheKey in window.localStorage)) {
    window.localStorage[mangaCacheKey] = JSON.stringify({});
}
function getMangaID (url) {
    if (url.includes("/comics/")) {
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
    this.update = function(sendDB = false) {
        if (this.webConfig) {
            this.reload();
            var params = "db=" + this.webConfig.key + 
                         "&pass=" + this.webConfig.pass + 
                         "&data=" + JSON.stringify( (sendDB ? this.db : {}) ) + 
                          (sendDB ? "" : "&action=get");
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
    this.deleteUpdate = function(hash) {
        if (this.webConfig) {
            var data = {};
            data[hash] = 1;
            var params = "db=" + this.webConfig.key +
                         "&pass=" + this.webConfig.pass +
                         "&action=delete" +
                         "&data=" + JSON.stringify(data);
            var req = new XMLHttpRequest();
            req.open("POST", "http://game.kiri.moe/manga/index.php");
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            req.send(params);
            req.readDB = this;
            req.onload = function (e) {
                this.readDB.merge(this.response);
                window.localStorage[this.readDB.updateKey] = new Date().toJSON();
                console.log("CHDB Updated after delete");
            }
            req.onerror = function (e) {
                console.log({msg:"Error deleting from CHDB", request:this});
            }
            console.log("Sending CHDB delete");
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
            this.update(true);
            if (this.onUpdate) {this.onUpdate();}
        }
    };
    this.delete = function(hash) {
        hash = this.cleanHash(hash);
        if (this.status(hash)) {
            delete this.db[hash];
            this.save();
            this.deleteUpdate(hash);
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
function getcleanhash(url) {
    var hash = gethash(url);
    return readDB.cleanHash(hash);
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
function markMangaPageChStatus() {
    var entries = $$js("table.chapters_list tr.chapter_row");
    for (var i = 0; i < entries.length; ++i) {
        var entry = entries[i];
        var a = $js("td>a", entry);
        if (!a) {continue;}
        var chhash = gethash(a.href);
        if (readDB.status(chhash)) {
            // visited
            entry.style["background-color"] = "lightgreen";
            if (!entry.unmark) {
                entry.unmark = true;
                entry.hash = chhash;
                entry.addEventListener("dblclick", function() {
                    if (this.style["background-color"] = "lightgreen") {
                        this.style["background-color"] = "";
                        ReadDB.delete(this.hash);
                    }
                });
            }
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
        case keycode.q:
            prev_chapter();
            break;
        case keycode.e:
            next_chapter();
            break
		case keycode.w:
        case keycode.up:
			if (scrollInterval === null) {
				window.scrollBy(0, -57);
				scrollInterval = setInterval(function () {
					window.scrollBy(0, -35);
				}, 30);
			}
            e.preventDefault();
			break;
		case keycode.s:
        case keycode.down:
			if (scrollInterval === null) {
				window.scrollBy(0, 57);
				scrollInterval = setInterval(function () {
					window.scrollBy(0, 35);
				}, 30);
			}
            e.preventDefault();
			break;
	}
	return;
}
var myKeyUp = function(e) {
	switch (e.keyCode) {
        case keycode.up:
        case keycode.down:
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
    // See if there is a chapter string
    var re_ch = /ch?(apter)?\.?( )?([\d]+(\.[\d]+(\.[\d]+)?)?)/gi;
    var res = re_ch.exec(name);
    if (res) {
        return res[3];
    }
    // fall back, just find a number
    var re = /[\d]+(\.[\d]+(\.[\d]+)?)?/gi;
    var res = re_results(re, name);
    console.log(res);
    if (res) {return res[res.length-1][0];}
    else {return null;}
}

function mangaListing($el) {
    this.build = function(info, $el) {
        var $div = $js.el("div", {class: "mangalistingmo"});
        var $des = $js.el("span", {innerHTML: info.description});
        var $img = $js.el("img", {src: info.img_src, alt:info.title});
        $img.style['float'] = "right";
        $img.style['max-width'] = "300px";
        $div.appendChild($img);
        $div.appendChild($des);
        $el.appendChild($div);
        $el.addEventListener("mouseover", function(e) {
            if (mangaListing.mo) {$js(".mangalistingmo", this).style['display'] = "block";}
        });
        $el.addEventListener("mouseout", function(e) {$js(".mangalistingmo", this).style['display'] = "none";});
    };

    // Add a mouseover display for manga listings
    var href = $js("a", $el).href;
    var id = getMangaID(href);
    var info = getMangaInfo(id);
    if (info) {
        return this.build(info, $el);
    }
    var req = new XMLHttpRequest();
    req.open("GET", href);
    req._this = this;
    req.el = $el;
    req.responseType = "document";
    req.onload = function(dom) {
        var $dom = this.response;
        var info = parseMangaPage($dom, this.responseURL);
        saveMangaInfo(info.id, info);
        this._this.build(info, this.el);
    };
    req.send();
}
mangaListing.init = function(frontpage=false) {
    if (frontpage) {
        return $js.addStyle(".mangalistingmo { \
            display: none; \
            position: absolute; \
            max-width: 600px; \
            background: white; \
            border: 1px solid grey; \
            padding: 5px; \
            overflow: auto; \
            margin-top: -200px; \
            margin-left: -660px;\
        }");
    }
    $js.addStyle(".mangalistingmo { \
        display: none; \
        position: absolute; \
        max-width: 600px; \
        background: white; \
        border: 1px solid grey; \
        padding: 5px; \
        overflow: auto; \
        margin-top: 15px; \
        margin-left: 300px;\
    }");
};
mangaListing.mo = true;

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
function mangaPage() {
    
    var mangaID = getMangaID(window.location.pathname);
    var mangaInfo = parseMangaPage(document);
    saveMangaInfo(mangaID, mangaInfo);
    console.log({msg:"Parsed Manga Page", id:mangaID, info:mangaInfo});
    
    markMangaPageChStatus();
    readDB.onUpdate = function() {
        markMangaPageChStatus();
    };
    document.addEventListener("visibilitychange", function() {
        if (!document.hidden) {
            readDB.checkForUpdate();
        }
    });

    // Allow for double click to update chapter status
    var chs = $$js("table.chapters_list tr.chapter_row");
    for (var i = 0; i < chs.length; ++i) {
        var ch = chs[i];
        ch.addEventListener("dblclick", function(e) {
            var a = $js("td>a", this);
            if (!a) {return;}
            var hash = gethash(a.href);
            readDB.set(hash);
        });
    }
    var chdata = {};
    for (var i = 0; i < chs.length; ++i) {
        var ch = chs[i];
        var a = $js("td>a", ch);
        if (!a) {continue;}
        var hash = getcleanhash(a.href);
        if (readDB.status(hash)) {
            var title = a.innerText.trim();
            chdata[hash] = title;
        }
    }
    console.log(chdata);
    if (config.settings.minfo_update) {
        var params = "db=" + "batotoMangaInfo" +
                     "&pass=" + readDB.webConfig.pass + 
                     "&action=set" + "&id=" + mangaID +
                     "&data=" + JSON.stringify(mangaInfo) +
                     "&chapters=" + JSON.stringify(chdata);
        var req = new XMLHttpRequest();
        req.open("POST", "http://game.kiri.moe/manga/index.php");
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.send(params);
        req.onload = function (e) {
            console.log({msg: "MangaInfoRemote updated", response: this.response});
        };
        req.onerror = function (e) {
            console.log({msg: "Error updating MangaInfoRemote", request: this});
        };
    }
}

function getSuggestedDownload($div, $img, title) {
    // Create holder to preserve order
    var $span = $js.el("span");
    $div.appendChild($span);
    
    // Create a data blob of these images
    var req = new XMLHttpRequest();
    var imgsrc = (config.settings.ajaxfix ? $img.src : "//cors-anywhere.herokuapp.com/" + $img.src);
    req.open("GET", imgsrc);
    $js.extend(req, {title: title, span: $span, 
                     type: $img.src.split(".").pop()});
    req.responseType = "arraybuffer";
    req.onload = function(event) {
        console.log({msg: "Got download resource", req: req, event: event});
        var data = new Blob([this.response], 
                            {type:"image/" + (this.type == "jpg" ? "jpeg" : this.type)});
        var $a = $js.el("a", {href: window.URL.createObjectURL(data), 
                              download: this.title + "." + this.type,
                              innerHTML: this.title});
        this.span.appendChild($a);
        this.span.appendChild($js.el("br"));
    };
    req.onerror = function(event) {
        console.log({msg: "Error getting download resource", req: req, event: event});
    };
    req.send();
}
function readerPage(mutations, instance) {
    if ($js("#reader>.suggested_title")) {
        // already did our thing
        return;
    }
    if (config.settings.https == false) {
        removeHTTPS();
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
        $js.css($js("#comic_page").parentNode.parentNode,
            { top: "0px", marginBottom: "0px", right: "0px" }
        );
        /*
        $js.extend( $js("#comic_page").parentNode.parentNode.style,
                    { top: "0px", marginBottom: "0px", right: "0px" }
                  );
        */
    }
    var title = $js("#content div.moderation_bar > ul > li:first-child a").innerHTML;
    title = title.replace(/ /g, "-");
    title = title.replace(/[\':]/g, "");
    
    var ch_select = $js("#content div.moderation_bar > ul > li:nth-child(2) select");
    var ch = ch_select.options[ch_select.selectedIndex].innerHTML;
    ch = getch(ch);
    if (ch.length < 2) ch = "0"+ch;

    for (var i = 0; i < ch_select.options.length; ++i) {
        var opt = ch_select.options[i];
        if (readDB.status(gethash(opt.value))) { opt.style['background-color'] = "lightgreen"; }
    }
    
    var page_select = $js("#content div.moderation_bar > ul select#page_select");
    if (page_select) {
        var parent = page_select.parentNode;
        parent.style['margin-right'] = "0px";
        var $div = $js.el("li", {'class': "page_max"});
        $div.style['display'] = "inline-block";
        $div.style['width'] = "20px";
        $div.innerHTML = "/" + page_select.options.length;
        $js.after(parent, $div);
        
        var bot = $$js("div.moderation_bar")[1];
        var bot_page_select = $js("select#page_select", bot);
        var bot_parent = bot_page_select.parentNode;
        bot_parent.style['margin-right'] = "0px";
        $js.after(bot_parent, $div.cloneNode(true));
    }
    if (!page_select) {
        // No pages... maybe multiple images?
        // This is usually webcomics/4komas
        var $bot = $$js("div.moderation_bar")[1];
        var $el = $js.el("div", {class: "suggested_title"});
        $el.style.textAlign = "center";

        title = title + "_c"+ ch;

        var imgs = $$js("#reader>div>img");
        for (var i = 0; i < imgs.length; ++i) {
            var pg = i + 1;
            var pg_str = (imgs.length == 1 ? "" : 
                           (imgs.length > 9 && pg <= 9 ? "p0"+pg : "p"+pg));
            var name = title + pg_str;
            getSuggestedDownload($el, imgs[i], name);
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
        getSuggestedDownload($el, img, name);
    } else {
        $el.innerHTML = name;
    }

    $el.style.textAlign = "center";
    $js.after($bot, $el);
}

if (window.location.protocol != "http:") {
    window.location.href = "http:" + window.location.href.slice(6);
}
var removeHTTPS = function() {
    //remote https this is done to ensure that our db operates on the same domain.
    var $links = $$js("a");
    for (var i = 0; i < $links.length; ++i) {
        var $a = $links[i];
        if (/(login)|(logout)/.exec($a.pathname)) {
            console.log( "Not removing HTTPS for " + $a.pathname );
            continue;
        }
        if ($a.protocol == "https:") {$a.protocol = "http:";}
    }
};

var config = {
    settings: {https: false, ajaxfix: false, mangamo_front: true, minfo_update: true},
    current: null,
    pages: {},
    init: function() {
        if (("BPconfig" in window.localStorage)) {
            $js.extend(this.settings, JSON.parse(window.localStorage["BPconfig"]));
        }
        // do configuration
        this.buildSettingsDialog();
        this.main();
    },
    buildSettingsDialog: function() {
        $js.addStyle(".BPconfig {\
            position: fixed; \
            bottom: 10px; \
            right: 10px; \
            width: 300px; \
            height: 300px; \
            display: none; \
            border: solid 2px line grey; \
            background: #f0f0f0; \
        }\
        .BPconfignub {\
            position: fixed; \
            right: 10px; \
            bottom: 10px; \
            opacity: 0.5; \
            color: white; \
        }\
        .BPconfighead {\
            position: relative;\
            height: 20px;\
            overflow: auto;\
            border-bottom: 1px solid black;\
        }\
        .BPconfigpage {\
            position: relative;\
            height: 279px;\
            width: 300px;\
            display: none;\
            padding-top: 5px; \
        }\
        .BPconfighead .BPconfigclose { float: right; max-height: 20px; cursor: pointer; }\
        .BPconfignub:hover { opacity: 1; cursor: pointer; }\
        .BPconfigpage>span { margin-left: 5px; margin-right: 5px; }\
        .BPconfigpage label { margin-left: 5px; }");
        var $nub = $js.el("div", {class: "BPconfignub", innerHTML: "{+}"});
        var $box = $js.el("div", {class: "BPconfig"});
        $nub.addEventListener("click", function () {
            if (getComputedStyle($box).display == "none") {$box.style['display'] = "block";}
            else {$box.style['display'] = "none";}
        });
        var $head = $js.el("div", {class: "BPconfighead"});
        var $exit = $js.el("span", {class: "BPconfigclose", innerHTML: "{x}"});
        $exit.addEventListener("click", function() {
            $box.style['display'] = "none";
        });
        $head.appendChild($exit);
        $box.appendChild($head);
        document.body.appendChild($nub);
        document.body.appendChild($box);
        this.$box = $box;
        this.$head = $head;
    },
    createPage: function(page) {
        var $conf = $js("BPconfig");
        var $tab = $js.el("span", {class: "BPconfigtab", innerHTML: page});
        var $page = $js.el("div", {class: "BPconfigpage"});
        
        if (Object.keys(this.pages).length == 0) {
            $page.style.display="block";
            $js.addClass($tab, "BPconfigtabsel");
            this.current = $page;
        }
        this.pages[page] = $page;
        this.$box.appendChild($page);
        this.$head.appendChild($tab);
        return $page;
    },
    main: function() { // creates main settings page
        var $main = this.createPage("Main");
        var $span = $js.el("span");
        var $box = $js.el("input", {id:"BPhttps", type:"checkbox", checked: this.settings.https});
        var $lbl = $js.el("label", {innerHTML: "Use HTTPS"});
        $lbl.setAttribute("for", "BPhttps");
        $box.onclick = function () {config.settings.https = this.checked; config.save();}
        $span.appendChild($box); $span.appendChild($lbl); $main.appendChild($span);

        var $span = $js.el("span");
        var $box = $js.el("input", {id:"BPajaxfix", type:"checkbox", checked: this.settings.ajaxfix});
        var $lbl = $js.el("label", {innerHTML: "Use AJAX fix for new firefox"});
        $lbl.setAttribute("for", "BPajaxfix");
        $box.onclick = function () {config.settings.ajaxfix = this.checked; config.save();}
        $span.appendChild($box); $span.appendChild($lbl); $main.appendChild($span);

        var $span = $js.el("span");
        var $box = $js.el("input", {id:"BPmangamofront", type:"checkbox", checked: this.settings.mangamo_front});
        var $lbl = $js.el("label", {innerHTML: "Front page mouseover shows manga info."});
        $lbl.setAttribute("for", "BPmangamofront");
        $box.onclick = function () {config.settings.mangamo_front = this.checked; 
                                    mangaListing.mo = this.checked; config.save();}
        $span.appendChild($box); $span.appendChild($lbl); $main.appendChild($span);
        
        $main.appendChild($js.el("br"));
        var $span = $js.el("span");
        var $box = $js.el("input", {id:"BPminfo_update", type:"checkbox", checked: this.settings.minfo_update});
        var $lbl = $js.el("label", {innerHTML: "Update Manga Info on remotehost."});
        $lbl.setAttribute("for", "BPminfo_update");
        $box.onclick = function () {config.settings.minfo_update = this.checked; config.save();}
        $span.appendChild($box); $span.appendChild($lbl); $main.appendChild($span);
    },
    save: function() {
        window.localStorage["BPconfig"] = JSON.stringify(this.settings);
    }
};

config.init();

if (config.settings.https == false) {
    removeHTTPS();
}

if (/\/reader/.exec(window.location.pathname)) {
    console.log("Reader Page");
    var $reader = $js("#reader");
    var observer = new MutationObserver( readerPage );
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
        readDB.onUpdate = function () {
            markchstatus();
        };
        var $lis = $$js("table.chapters_list tr:not(.header)>td:nth-child(2)");
        mangaListing.init();
        for (var i = 0; i < $lis.length; ++i) {
            mangaListing($lis[i]);
        }

        var $header = $js("h3.maintitle");
        var $span = $js.el("span", {style: "float: right; font-size: .8em;"});
        var $box = $js.el("input", {id: "BP_manga_mo", type:"checkbox", checked:mangaListing.mo});
        var $lbl = $js.el("label", {innerHTML: "Mouseover Window", style: "margin-left: 5px;"});

        $lbl.setAttribute("for", "BP_manga_mo");
        $box.onclick = function() {mangaListing.mo = this.checked;};

        $span.appendChild($box);
        $span.appendChild($lbl);
        $header.appendChild($span);
        allMyFollows();
    }

    if (/\/comics/.exec(window.location.pathname)) {
        // A manga page
        console.log("Manga Page");
        mangaPage();
    }

    // front page
    if (window.location.pathname == "/") {
        if ($js("#hook_watched_items")) {
            marksidebarchstatus();
            document.addEventListener("visibilitychange", function () {
                if (!document.hidden) {
                    readDB.checkForUpdate();
                    marksidebarchstatus();
                }
            });
            readDB.onUpdate = function () {
                marksidebarchstatus();
            };

            var $mangas = $$js("li.hentry", $js("#hook_watched_items"));
            mangaListing.init(true);
            mangaListing.mo = config.settings.mangamo_front;
            for (var i = 0; i < $mangas.length; ++i) {            
                mangaListing($mangas[i]);
            }
        }
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
