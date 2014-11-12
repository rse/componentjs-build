/*
**  ComponentJS -- Component System for JavaScript <http://componentjs.com>
**  Copyright (c) 2009-2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
 *  This is a ComponentJS plugin which provides a Promise-based
 *  environment for test-driving a ComponentJS application based on a
 *  set of use-cases.
 */

/* global ComponentJS: false */
/* eslint no-unused-vars: 0 */
/* jshint unused: false */

ComponentJS.plugin("testdrive", function (_cs, $cs, GLOBAL) {

    /*  global API function: show suite of usecases one can drive  */
    $cs.suite = function () {
        /*  sanity check run-time environment  */
        var $ = GLOBAL.jQuery || GLOBAL.$;
        if (typeof $ !== "function")
            throw new Error("testdrive#suite() requires jQuery");

        /*  the common CSS prefix (should be unique and not in conflict with the SPA classes!)  */
        var name = "ComponentJS-testdrive-suite";

        /*  find UI or create UI initually */
        var ui = $("body > ." + name);
        if (ui.length === 0) {
            ui = $(
                "<div class=\"" + name + "\">" +
                    "<div class=\"" + name + "-head\">" +
                        "<b>ComponentJS</b> Test-Drive Use-Cases Suite" +
                        "<div class=\"" + name + "-head-close\">close</div>" +
                    "</div>" +
                    "<div class=\"" + name + "-list\"></div>" +
                "</div>"
            );
            ui.hide();
            $("body").append(ui);
        }

        /*  provide helper functions for animating the opening/closing of the UI  */
        var open = function (complete) {
            $(ui).show().animate({ top: 0 }, 300, "swing", complete);
        };
        var close = function (complete) {
            $(ui).animate({ top: -uih }, 300, "swing", function () {
                $(ui).hide();
                $(ui).remove();
                if (typeof complete === "function")
                    complete();
            });
        };

        /*  allow one to close on subsequent call  */
        if ($("body > ." + name).filter(":visible").length > 0) {
            close();
            return;
        }

        /*  determine sizes  */
        var w = $(GLOBAL).width();
        var uiw = (w / 10) * 8;
        var uih = 400;

        /*  style the UI panel  */
        ui
            .width(uiw)
            .height(uih)
            .css("top", -uih)
            .css("left", (w / 2) - (uiw / 2))
            .css("position", "absolute")
            .css("z-index", 10000)
            .css("background-color", "#f8f8f8")
            .css("-webkit-box-shadow", "0 4px 16px 0 #909090")
            .css("box-shadow", "0 4px 16px 0 #909090")
            .css("-webkit-border-radius", "0 0 8px 8px")
            .css("border-radius", "0 0 8px 8px")
            .css("color", "#000000")
            .css("font-family", "sans-serif")
            .css("font-size", "11pt");

        /*  style the UI head  */
        $("." + name + "-head", ui)
            .width(uiw - 20)
            .height(20)
            .css("position", "relative")
            .css("background", "#666666")
            .css("background", "-moz-linear-gradient(top, #666666 0%, #333333 49%, #222222 51%, #000000 100%)")
            .css("background", "-webkit-linear-gradient(top, #666666 0% ,#333333 49% ,#222222 51%, #000000 100%)")
            .css("background", "linear-gradient(to bottom, #666666 0%, #333333 49%, #222222 51%, #000000 100%)")
            .css("color", "#ffffff")
            .css("padding", "7px 10px 7px 10px")
            .css("font-size", "16px");
        $("." + name + "-head-close", ui)
            .css("position", "absolute")
            .css("right", "10px")
            .css("top", "6px")
            .css("padding", "4px 10px 4px 10px")
            .css("font-size", "12px")
            .css("color", "#c0c0c0")
            .css("border", "1px solid #606060")
            .css("cursor", "pointer");

        /*  style the UI list  */
        $("." + name + "-list", ui)
            .width(uiw)
            .height(uih - 30)
            .css("overflow", "scroll")
            .css("overflow-x", "hidden");

        /*  generate the UI list content  */
        var table = $("<table></table>");
        table.append(
            "<tr class=\"" + name + "-list-row-first\">" +
                "<td class=\"" + name + "-list-name\">Identifier</td>" +
                "<td class=\"" + name + "-list-desc\">Description</td>" +
            "</tr>"
        );
        var k = 0;
        _cs.foreach(_cs.keysof(usecase).sort(), function (id) {
            table.append(
                "<tr data-id=\"" + id + "\" class=\"" + name + "-list-row " + name + "-list-row-" + (k++ % 2) + "\">" +
                    "<td class=\"" + name + "-list-name\">" + id + "</td>" +
                    "<td class=\"" + name + "-list-desc\">" + usecase[id].desc + "</td>" +
                "</tr>"
            );
        });
        $("." + name + "-list", ui).html(table);

        /*  style the UI list content  */
        $("." + name + "-list table", ui)
            .width(uiw)
            .css("border-collapse", "collapse");
        $("." + name + "-list-row", ui)
            .css("cursor", "pointer");
        $("." + name + "-list-row-first", ui)
            .width(uiw)
            .css("background-color", "#909090")
            .css("color", "#f0f0f0");
        $("." + name + "-list-row-1", ui)
            .width(uiw)
            .css("background-color", "#f0f0f0");
        $("." + name + "-list-name", ui)
            .css("padding", "2px 10px 2px 10px")
            .css("font-family", "monospace");
        $("." + name + "-list-desc", ui)
            .width("100%")
            .css("padding", "2px 10px 2px 10px");

        /*  attach event handler to list items  */
        $("." + name + "-list-row", ui).on("click", function (ev) {
            /*  support tr/td as target  */
            var el = ev.target;
            if ($(el).prop("tagName") !== "tr")
                el = $(el).parent();

            /*  fetch usecase id  */
            var id = $(el).data("id");
            if (typeof id === "string" && id !== "") {
                /*  close UI and execute usecase  */
                close(function () {
                    $cs.drive(id).then(null, function (e) {
                        /* global alert: true */
                        /* eslint no-alert: 0 */
                        alert("ComponentJS: testdrive: use case \"" + "\" failed: " + e);
                    });
                });
            }
        });

        /*  attach event handler to close button  */
        $("." + name + "-head-close", ui).on("click", close);

        /*  initially open the UI  */
        open();
    };


    /*  global API function: Promises/A+ compliant promise  */
    $cs.promise = (function () {
        var module = { exports: {} };
        /* jshint -W062 */
        /* jshint -W058 */
        /* jshint eqeqeq: false */
        /* jshint asi: true */
        /* jshint boss: true */
        /* jshint expr: true */
        /* jshint maxlen: 5000 */
        /* global setImmediate: false */
        /* global setTimeout: false */
        /* global process: false */
        /* global define: false */
        /* eslint no-unused-expressions: 0 */
        /* eslint yoda: 0 */
        /* eslint semi: 0 */
        /* eslint space-infix-ops: 0 */
        /* eslint eqeqeq: 0 */
        /* eslint no-sequences: 0 */
        /* eslint new-parens: 0 */
        /* eslint no-use-before-define: 0 */
        /* eslint space-return-throw-case: 0 */
        /* eslint no-catch-shadow: 0 */
        /* eslint no-shadow: 0 */
        /* eslint comma-spacing: 0 */
        /* --- START VERBATIM EMBEDDING ---- */

    /*
    **  Thenable -- Embeddable Minimum Strictly-Compliant Promises/A+ 1.1.1 Thenable
    **  Copyright (c) 2013-2014 Ralf S. Engelschall <http://engelschall.com>
    **  Licensed under The MIT License <http://opensource.org/licenses/MIT>
    **  Source-Code distributed on <http://github.com/rse/thenable>
    */
    !function(a,b,c){"function"==typeof define&&"undefined"!=typeof define.amd?define(b,function(){return c(a)}):"object"==typeof module&&"object"==typeof module.exports?module.exports=c(a):a[b]=function(){var d=a[b],e=c(a);return e.noConflict=function(){return a[b]=d,e},e}()}(this,"Thenable",function(){var a=0,b=1,c=2,d=function(b){return this instanceof d?(this.id="Thenable/1.0.6",this.state=a,this.fulfillValue=void 0,this.rejectReason=void 0,this.onFulfilled=[],this.onRejected=[],this.proxy={then:this.then.bind(this)},void("function"==typeof b&&b.call(this,this.fulfill.bind(this),this.reject.bind(this)))):new d(b)};d.prototype={fulfill:function(a){return e(this,b,"fulfillValue",a)},reject:function(a){return e(this,c,"rejectReason",a)},then:function(a,b){var c=this,e=new d;return c.onFulfilled.push(h(a,e,"fulfill")),c.onRejected.push(h(b,e,"reject")),f(c),e.proxy}};var e=function(b,c,d,e){return b.state===a&&(b.state=c,b[d]=e,f(b)),b},f=function(a){a.state===b?g(a,"onFulfilled",a.fulfillValue):a.state===c&&g(a,"onRejected",a.rejectReason)},g=function(a,b,c){if(0!==a[b].length){var d=a[b];a[b]=[];var e=function(){for(var a=0;a<d.length;a++)d[a](c)};"object"==typeof process&&"function"==typeof process.nextTick?process.nextTick(e):"function"==typeof setImmediate?setImmediate(e):setTimeout(e,0)}},h=function(a,b,c){return function(d){if("function"!=typeof a)b[c].call(b,d);else{var e;try{e=a(d)}catch(f){return void b.reject(f)}i(b,e)}}},i=function(a,b){if(a===b||a.proxy===b)return void a.reject(new TypeError("cannot resolve promise with itself"));var c;if("object"==typeof b&&null!==b||"function"==typeof b)try{c=b.then}catch(d){return void a.reject(d)}if("function"!=typeof c)a.fulfill(b);else{var e=!1;try{c.call(b,function(c){e||(e=!0,c===b?a.reject(new TypeError("circular thenable chain")):i(a,c))},function(b){e||(e=!0,a.reject(b))})}catch(d){e||a.reject(d)}}};return d});

        /* --- END VERBATIM EMBEDDING ---- */
        return module.exports;
    })();


    /*  internal store of usecases  */
    var usecase = {};

    /*  global API function: define/undefine a usecase  */
    $cs.usecase = function () {
        /*  determine parameters  */
        var params = $cs.params("usecase", arguments, {
            name:       { pos: 0, req: true, valid: "string"          },
            desc:       { pos: 1, req: true, valid: "string"          },
            conf:       {         def: {},   valid: "object"          },
            func:       { pos: 2, req: true, valid: "(function|null)" }
        });

        /*  remember or delete usecase  */
        if (params.func === null)
            delete usecase[params.name];
        else if (_cs.isdefined(usecase[params.name]))
            throw _cs.exception("usecase", "usecase of name \"" + params.name + "\" already defined");
        else {
            usecase[params.name] = {
                desc: params.desc,
                conf: params.conf,
                func: params.func
            };
        }

        return;
    };


    /*  global API function: execute a usecase  */
    $cs.drive = function () {
        /* global setTimeout: false */
        /* global clearTimeout: false */

        /*  determine parameters  */
        var params = $cs.params("drive", arguments, {
            name:       { pos: 0, req: true,    valid: "string" },
            conf:       { pos: 1, def: {},      valid: "object" },
            timeout:    { pos: 2, def: 10*1000, valid: "number" }
        });

        /*  sanity check usecase  */
        var uc = usecase[params.name];
        if (!_cs.isdefined(uc))
            throw _cs.exception("drive", "invalid usecase name \"" + params.name + "\"");

        /*  create promise  */
        var promise  = new $cs.promise();
        var response = promise.proxy;
        var resolved = false;

        /*  optionally reject promise on timeout  */
        var to = null;
        if (params.timeout > 0) {
            to = setTimeout(function () {
                to = null;
                if (!resolved) {
                    /*  reject promise because of timeout  */
                    resolved = true;
                    $cs.debug(1, "drive: usecase \"" + params.name + "\", TIMEOUT after " + params.timeout + " ms");
                    promise.reject(new Error("usecase \"" + params.name + "\": timeout"));
                }
            }, params.timeout);
        }

        /*  determine configuration  */
        var conf = {};
        _cs.extend(conf, uc.conf);
        _cs.extend(conf, params.conf);

        /*  execute usecase  */
        $cs.debug(1, "drive: usecase \"" + params.name + "\" (" + usecase[params.name].desc + "), EXECUTING" +
            (_cs.keysof(params.conf).length > 0 ? " with configuration " + _cs.json(params.conf) : "") +
            (params.timeout > 0 ? " and timeout of " + params.timeout + " ms" : ""));
        var result;
        try {
            result = uc.func.apply(conf, [ conf ]);
        }
        catch (ex) {
            if (!resolved) {
                /*  reject promise because of exception  */
                resolved = true;
                $cs.debug(1, "drive: usecase \"" + params.name + "\", EXCEPTION: " + ex.message);
                promise.reject(new Error("usecase \"" + params.name + "\": " + ex.message));
            }
        }

        /*  clear still pending timer  */
        if (to !== null) {
            clearTimeout(to);
            to = null;
        }

        /*  in case of no errors and no timeout, handle promise response  */
        if (!resolved) {
            if (   (typeof result === "object" || typeof result === "function")
                && typeof result.then === "function"                           )
                /*  replace our response promise with the given one  */
                response = result;
            else
                /*  fulfill our response promise  */
                promise.fulfill(true);
        }

        /*  log the regular reject of the promise, too  */
        response = response.then(null, function (e) {
            $cs.debug(1, "drive: usecase \"" + params.name + "\" failed: " + e);
            return e;
        });

        /*  return response promise  */
        return response;
    };


    /*  global API function: ensure a state to occur  */
    $cs.ensure = function () {
        /*  determine parameters  */
        var params = $cs.params("ensure", arguments, {
            path:     { pos: 0, req: true,  valid: "string"  },
            state:    { pos: 1, req: true,  valid: "string"  },
            min:      {         def: true,  valid: "boolean" },
            max:      {         def: false, valid: "boolean" },
            sync:     {         def: false, valid: "boolean" }
        });

        /*  create promise  */
        var promise = new $cs.promise();

        /*  execute state transition request  */
        var comp = $cs(params.path);
        comp.state({
            state: params.state,
            min:   params.min,
            max:   params.max,
            sync:  params.sync,
            func:  function (state) {
                promise.fulfill(comp);
            }
        });

        /*  return promise  */
        return promise.proxy;
    };


    /*  list of currently awaited scenarios  */
    var awaited = [];

    /*  global API function: await a particular state to occur  */
    $cs.await = function (path, state, direction) {
        /*  determine parameters  */
        var params = $cs.params("await", arguments, {
            path:       { pos: 0, req: true,    valid: "string" },
            state:      { pos: 1, req: true,    valid: "string" },
            direction:  { pos: 2, def: "enter", valid: "string" }
        });

        /*  sanity check state  */
        if (_cs.states.length <= 1)
            throw _cs.exception("await", "no user-defined component states");
        var idx = _cs.state_name2idx(params.state);
        if (idx === -1)
            throw _cs.exception("await", "invalid state name \"" + params.state + "\": no such state defined");

        /*  sanity check direction  */
        if (!params.direction.match(/^(?:enter|leave)$/))
            throw _cs.exception("await", "invalid direction \"" + params.direction + "\"");

        /*  create new promise  */
        var promise = new $cs.promise();

        /*  store awaiting situation  */
        var i;
        for (i = 0; i < awaited.length; i++) {
            if (   awaited[i].path      === params.path
                && awaited[i].state     === params.state
                && awaited[i].direction === params.direction) {
                break;
            }
        }
        if (i === awaited.length) {
            awaited[i] = {
                path:      params.path,
                comp:      $cs(params.path),
                state:     params.state,
                direction: params.direction,
                promises:  []
            };
        }
        awaited[i].promises.push(promise);

        /*  at least once check current situation  */
        var comp = awaited[i].comp;
        if (comp !== _cs.none)
            changeOccured(comp, comp.state(), "enter");

        /*  return (proxied) promise  */
        return promise.proxy;
    };

    /*  a situation change occurred...  */
    var changeOccured = function (comp, state, direction) {
        var i;

        /*  if a component was created, refresh all component lookups
            which previously resolved to the "none" component, in the hope
            they now resolve to the new component  */
        if (_cs.states.length <= 1)
            throw _cs.exception("await(internal)", "no user-defined component states");
        if (state === _cs.states[1].state && direction === "enter")
            for (i = 0; i < awaited.length; i++)
                if (awaited[i].comp === _cs.none)
                    awaited[i].comp = $cs(awaited[i].path);

        /*  iterate over all awaiting situations...  */
        for (i = 0; typeof awaited[i] !== "undefined";) {
            if (   awaited[i].comp      === comp
                && awaited[i].state     === state
                && awaited[i].direction === direction) {

                /*  asynchronously fulfill all promises and remove entry from awaited situations  */
                for (var j = 0; j < awaited[i].promises.length; j++) {
                    (function (promise, comp) {
                        /* global setTimeout: false */
                        setTimeout(_cs.hook("ComponentJS:settimeout:func", "pass", function () {
                            promise.fulfill(comp);
                        }), 0);
                    })(awaited[i].promises[j], comp);
                }
                awaited.splice(i, 1);
            }
            else
                i++;
        }

        /* if a component was destroyed, it will soon no longer be
           attached to the component tree, so change its lookup back to
           "none" in all remaining awaiting situations  */
        if (state === _cs.states[1].state && direction === "leave")
            for (i = 0; i < awaited.length; i++)
                if (awaited[i].comp === comp)
                    awaited[i].comp = _cs.none;
    };

    /*  hook into the core functionality  */
    _cs.latch("ComponentJS:bootstrap", function () {
        _cs.latch("ComponentJS:comp-created", function (comp) {
            if (_cs.states.length <= 1)
                throw _cs.exception("await(internal)", "no user-defined component states");
            changeOccured(comp, _cs.states[1].state, "enter");
        });
        _cs.latch("ComponentJS:comp-destroyed", function (comp) {
            if (_cs.states.length <= 1)
                throw _cs.exception("await(internal)", "no user-defined component states");
            changeOccured(comp, _cs.states[1].state, "leave");
        });
        _cs.latch("ComponentJS:state-enter", function (comp, state) {
            changeOccured(comp, state, "enter");
        });
        _cs.latch("ComponentJS:state-leave", function (comp, state) {
            changeOccured(comp, state, "leave");
        });
    });


    /*  global API function: promise-based polling  */
    $cs.poll = function () {
        /*  determine parameters  */
        var params = $cs.params("poll", arguments, {
            check: { pos: 0, req: true, valid: "function"          },
            wait:  { pos: 1, def: 100,  valid: "(function|number)" },
            max:   { pos: 2, def: 600,  valid: "number"            }
        });

        /*  optionally on-the-fly provide waiting-promise  */
        if (typeof params.wait === "number") {
            params.wait = (function (wait) {
                return function () {
                    return $cs.sleep(wait);
                };
            })(params.wait);
        }

        /*  create promise around a polling loop  */
        var check = params.check;
        var wait  = params.wait;
        var max   = params.max;
        return new $cs.promise(function (fulfill, reject) {
            var loop = function () {
                if      (max-- <= 0) reject();
                else if (check())    fulfill();
                else                 wait().then(loop);
            };
            loop();
        });
    };


    /*  global API function: promise-based sleeping  */
    $cs.sleep = function () {
        /*  determine parameters  */
        var params = $cs.params("sleep", arguments, {
            ms: { pos: 0, req: true, valid: "number" }
        });

        /*  create promise around setTimeout  */
        return new $cs.promise(function (fulfill, reject) {
            /* global setTimeout: false */
            setTimeout(function () {
                fulfill();
            }, params.ms);
        });
    };


    /*  global API function: promise-based jQuery#one() with additional DOM mutation support  */
    $cs.once = function () {
        /*  determine parameters  */
        var params = $cs.params("once", arguments, {
            selector:    { pos: 0, req: true, valid: "any"           },
            events:      { pos: 1, req: true, valid: "string"        },
            subselector: { pos: 2, def: null, valid: "(string|null)" }
        });

        /*  sanity check run-time environment  */
        var $ = GLOBAL.jQuery || GLOBAL.$;
        if (typeof $ !== "function")
            throw new Error("testdrive#once() requires jQuery");

        /*  create promise  */
        var promise = new $cs.promise();

        /*  one-time bind to the DOM event  */
        if (params.events === "mutation") {
            if (typeof GLOBAL.MutationObserver !== "function")
                throw new Error("once: MutationObserver not available");
            if (params.subselector !== null)
                throw new Error("once: mutation event does not support sub-selector");
            var node = $(params.selector);
            if (node.length === 0)
                throw new Error("once: no nodes found");
            if (node.length !== 1)
                throw new Error("once: more than exactly one node found");
            var observer = new GLOBAL.MutationObserver(function (mutations) {
                observer.disconnect();
                promise.fulfill(mutations);
            });
            observer.observe(node.get(0), {
                attributes:    true,
                characterData: true,
                childList:     true,
                subtree:       false
            });
        }
        else {
            $(params.selector).one(params.events, params.subselector, function (ev) {
                promise.fulfill(ev);
            });
        }

        /*  return promise  */
        return promise.proxy;
    };

});

