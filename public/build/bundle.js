
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/SearchBar.svelte generated by Svelte v3.44.0 */
    const file$c = "src/components/SearchBar.svelte";

    function create_fragment$c(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let t0;
    	let div2;
    	let div1;
    	let input;
    	let t1;
    	let span;
    	let i;
    	let t2;
    	let div3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t1 = space();
    			span = element("span");
    			i = element("i");
    			t2 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "column is-3");
    			add_location(div0, file$c, 20, 2, 449);
    			attr_dev(input, "class", "input is-rounded is-ubuntu svelte-4dpj9z");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Search for recipes...");
    			add_location(input, file$c, 23, 4, 545);
    			attr_dev(i, "class", "fas fa-search has-text-black-ter svelte-4dpj9z");
    			add_location(i, file$c, 31, 5, 775);
    			attr_dev(span, "class", "icon is-right");
    			add_location(span, file$c, 30, 4, 717);
    			attr_dev(div1, "class", "control has-icons-right");
    			add_location(div1, file$c, 22, 3, 503);
    			attr_dev(div2, "class", "column");
    			add_location(div2, file$c, 21, 2, 479);
    			attr_dev(div3, "class", "column is-3");
    			add_location(div3, file$c, 35, 2, 854);
    			attr_dev(div4, "class", "columns");
    			add_location(div4, file$c, 19, 1, 425);
    			attr_dev(div5, "class", "container block");
    			add_location(div5, file$c, 18, 0, 394);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div2);
    			append_dev(div2, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*searched*/ ctx[0]);
    			append_dev(div1, t1);
    			append_dev(div1, span);
    			append_dev(span, i);
    			append_dev(div4, t2);
    			append_dev(div4, div3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(input, "keypress", /*handleKey*/ ctx[2], false, false, false),
    					listen_dev(span, "click", /*handleSearch*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searched*/ 1 && input.value !== /*searched*/ ctx[0]) {
    				set_input_value(input, /*searched*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SearchBar', slots, []);
    	const dispatcher = createEventDispatcher();
    	let searched = "";

    	const handleSearch = () => {
    		if (!searched) return;
    		dispatcher('search', { search: true, searched });
    	};

    	const handleKey = e => {
    		if (e.keyCode == 13) handleSearch();
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SearchBar> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searched = this.value;
    		$$invalidate(0, searched);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatcher,
    		searched,
    		handleSearch,
    		handleKey
    	});

    	$$self.$inject_state = $$props => {
    		if ('searched' in $$props) $$invalidate(0, searched = $$props.searched);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searched, handleSearch, handleKey, input_input_handler];
    }

    class SearchBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/components/mini_components/TextIcon.svelte generated by Svelte v3.44.0 */

    const file$b = "src/components/mini_components/TextIcon.svelte";

    // (6:1) {#if label != "" && icon_right}
    function create_if_block_1$2(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(span, "class", "is-ubuntu");
    			add_location(span, file$b, 6, 2, 152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(6:1) {#if label != \\\"\\\" && icon_right}",
    		ctx
    	});

    	return block;
    }

    // (14:1) {#if label != "" && !icon_right}
    function create_if_block$4(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(span, "class", "is-ubuntu");
    			add_location(span, file$b, 14, 2, 323);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(14:1) {#if label != \\\"\\\" && !icon_right}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let span1;
    	let t0;
    	let span0;
    	let i;
    	let i_class_value;
    	let t1;
    	let if_block0 = /*label*/ ctx[2] != "" && /*icon_right*/ ctx[3] && create_if_block_1$2(ctx);
    	let if_block1 = /*label*/ ctx[2] != "" && !/*icon_right*/ ctx[3] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span0 = element("span");
    			i = element("i");
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(i, "class", i_class_value = "" + ((/*is_icon_full*/ ctx[1] ? 'fas' : 'far') + " " + /*icon*/ ctx[0]));
    			add_location(i, file$b, 10, 2, 225);
    			attr_dev(span0, "class", "icon");
    			add_location(span0, file$b, 9, 1, 203);
    			attr_dev(span1, "class", "icon-text");
    			add_location(span1, file$b, 4, 0, 91);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			if (if_block0) if_block0.m(span1, null);
    			append_dev(span1, t0);
    			append_dev(span1, span0);
    			append_dev(span0, i);
    			append_dev(span1, t1);
    			if (if_block1) if_block1.m(span1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[2] != "" && /*icon_right*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(span1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*is_icon_full, icon*/ 3 && i_class_value !== (i_class_value = "" + ((/*is_icon_full*/ ctx[1] ? 'fas' : 'far') + " " + /*icon*/ ctx[0]))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (/*label*/ ctx[2] != "" && !/*icon_right*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(span1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextIcon', slots, []);
    	let { icon, is_icon_full = true, label = "", icon_right = false } = $$props;
    	const writable_props = ['icon', 'is_icon_full', 'label', 'icon_right'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('is_icon_full' in $$props) $$invalidate(1, is_icon_full = $$props.is_icon_full);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('icon_right' in $$props) $$invalidate(3, icon_right = $$props.icon_right);
    	};

    	$$self.$capture_state = () => ({ icon, is_icon_full, label, icon_right });

    	$$self.$inject_state = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('is_icon_full' in $$props) $$invalidate(1, is_icon_full = $$props.is_icon_full);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('icon_right' in $$props) $$invalidate(3, icon_right = $$props.icon_right);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [icon, is_icon_full, label, icon_right];
    }

    class TextIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			icon: 0,
    			is_icon_full: 1,
    			label: 2,
    			icon_right: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextIcon",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !('icon' in props)) {
    			console.warn("<TextIcon> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<TextIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<TextIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_icon_full() {
    		throw new Error("<TextIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_icon_full(value) {
    		throw new Error("<TextIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon_right() {
    		throw new Error("<TextIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon_right(value) {
    		throw new Error("<TextIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/mini_components/ButtonIcon.svelte generated by Svelte v3.44.0 */

    const file$a = "src/components/mini_components/ButtonIcon.svelte";

    // (8:1) {#if (icon_right && label != "")}
    function create_if_block_1$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(span, "class", "is-ubuntu");
    			add_location(span, file$a, 8, 2, 244);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(8:1) {#if (icon_right && label != \\\"\\\")}",
    		ctx
    	});

    	return block;
    }

    // (14:1) {#if (!icon_right && label != "")}
    function create_if_block$3(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(span, "class", "is-ubuntu");
    			add_location(span, file$a, 14, 2, 440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(14:1) {#if (!icon_right && label != \\\"\\\")}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let button;
    	let t0;
    	let span;
    	let i;
    	let i_class_value;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*icon_right*/ ctx[3] && /*label*/ ctx[2] != "" && create_if_block_1$1(ctx);
    	let if_block1 = !/*icon_right*/ ctx[3] && /*label*/ ctx[2] != "" && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			i = element("i");
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(i, "class", i_class_value = "" + ((/*is_icon_full*/ ctx[1] ? 'fas' : 'far') + " " + /*icon*/ ctx[0]));
    			add_location(i, file$a, 11, 2, 341);
    			attr_dev(span, "class", "icon is-medium has-text-centered");
    			add_location(span, file$a, 10, 1, 291);
    			attr_dev(button, "class", "button is-rounded is-vcentered is-centered");
    			add_location(button, file$a, 6, 0, 124);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, span);
    			append_dev(span, i);
    			append_dev(button, t1);
    			if (if_block1) if_block1.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*handleClick*/ ctx[4])) /*handleClick*/ ctx[4].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*icon_right*/ ctx[3] && /*label*/ ctx[2] != "") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*is_icon_full, icon*/ 3 && i_class_value !== (i_class_value = "" + ((/*is_icon_full*/ ctx[1] ? 'fas' : 'far') + " " + /*icon*/ ctx[0]))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (!/*icon_right*/ ctx[3] && /*label*/ ctx[2] != "") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(button, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ButtonIcon', slots, []);
    	let { icon, is_icon_full = true, label = "", icon_right = false } = $$props;
    	let { handleClick = null } = $$props;
    	const writable_props = ['icon', 'is_icon_full', 'label', 'icon_right', 'handleClick'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ButtonIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('is_icon_full' in $$props) $$invalidate(1, is_icon_full = $$props.is_icon_full);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('icon_right' in $$props) $$invalidate(3, icon_right = $$props.icon_right);
    		if ('handleClick' in $$props) $$invalidate(4, handleClick = $$props.handleClick);
    	};

    	$$self.$capture_state = () => ({
    		icon,
    		is_icon_full,
    		label,
    		icon_right,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('icon' in $$props) $$invalidate(0, icon = $$props.icon);
    		if ('is_icon_full' in $$props) $$invalidate(1, is_icon_full = $$props.is_icon_full);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('icon_right' in $$props) $$invalidate(3, icon_right = $$props.icon_right);
    		if ('handleClick' in $$props) $$invalidate(4, handleClick = $$props.handleClick);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [icon, is_icon_full, label, icon_right, handleClick];
    }

    class ButtonIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			icon: 0,
    			is_icon_full: 1,
    			label: 2,
    			icon_right: 3,
    			handleClick: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ButtonIcon",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !('icon' in props)) {
    			console.warn("<ButtonIcon> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_icon_full() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_icon_full(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon_right() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon_right(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleClick() {
    		throw new Error("<ButtonIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleClick(value) {
    		throw new Error("<ButtonIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/components/recipe_page/Ingredient.svelte generated by Svelte v3.44.0 */
    const file$9 = "src/components/recipe_page/Ingredient.svelte";

    // (8:1) {#if ingredient != ""}
    function create_if_block$2(ctx) {
    	let texticon;
    	let current;

    	texticon = new TextIcon({
    			props: {
    				icon: "fa-check",
    				label: /*amount*/ ctx[1] + "  " + /*ingredient*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(texticon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(texticon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const texticon_changes = {};
    			if (dirty & /*amount, ingredient*/ 3) texticon_changes.label = /*amount*/ ctx[1] + "  " + /*ingredient*/ ctx[0];
    			texticon.$set(texticon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(texticon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(texticon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(texticon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(8:1) {#if ingredient != \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let current;
    	let if_block = /*ingredient*/ ctx[0] != "" && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "column is-half has-text-centered");
    			add_location(div, file$9, 6, 0, 113);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*ingredient*/ ctx[0] != "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*ingredient*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ingredient', slots, []);
    	let { ingredient, amount } = $$props;
    	const writable_props = ['ingredient', 'amount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ingredient> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('ingredient' in $$props) $$invalidate(0, ingredient = $$props.ingredient);
    		if ('amount' in $$props) $$invalidate(1, amount = $$props.amount);
    	};

    	$$self.$capture_state = () => ({ TextIcon, ingredient, amount });

    	$$self.$inject_state = $$props => {
    		if ('ingredient' in $$props) $$invalidate(0, ingredient = $$props.ingredient);
    		if ('amount' in $$props) $$invalidate(1, amount = $$props.amount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ingredient, amount];
    }

    class Ingredient extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { ingredient: 0, amount: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ingredient",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*ingredient*/ ctx[0] === undefined && !('ingredient' in props)) {
    			console.warn("<Ingredient> was created without expected prop 'ingredient'");
    		}

    		if (/*amount*/ ctx[1] === undefined && !('amount' in props)) {
    			console.warn("<Ingredient> was created without expected prop 'amount'");
    		}
    	}

    	get ingredient() {
    		throw new Error("<Ingredient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ingredient(value) {
    		throw new Error("<Ingredient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get amount() {
    		throw new Error("<Ingredient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set amount(value) {
    		throw new Error("<Ingredient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/recipe_page/IngredientList.svelte generated by Svelte v3.44.0 */
    const file$8 = "src/components/recipe_page/IngredientList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (15:2) {#each ingredients as ingredient, i}
    function create_each_block$1(ctx) {
    	let ingredient;
    	let current;

    	ingredient = new Ingredient({
    			props: {
    				ingredient: /*ingredient*/ ctx[2],
    				amount: /*amounts*/ ctx[0][/*i*/ ctx[4]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(ingredient.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(ingredient, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const ingredient_changes = {};
    			if (dirty & /*ingredients*/ 2) ingredient_changes.ingredient = /*ingredient*/ ctx[2];
    			if (dirty & /*amounts*/ 1) ingredient_changes.amount = /*amounts*/ ctx[0][/*i*/ ctx[4]];
    			ingredient.$set(ingredient_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ingredient.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ingredient.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ingredient, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(15:2) {#each ingredients as ingredient, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div0;
    	let p;
    	let t1;
    	let div2;
    	let div1;
    	let current;
    	let each_value = /*ingredients*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Recipe ingredients";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(p, "class", "subtitle is-ubuntu has-text-weight-bold is-4");
    			add_location(p, file$8, 8, 1, 152);
    			attr_dev(div0, "class", "container block has-text-centered");
    			add_location(div0, file$8, 7, 0, 103);
    			attr_dev(div1, "class", "columns is-multiline is-vcentered has-no-margin svelte-9wwksp");
    			add_location(div1, file$8, 13, 1, 274);
    			attr_dev(div2, "class", "container block");
    			add_location(div2, file$8, 12, 0, 243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*ingredients, amounts*/ 3) {
    				each_value = /*ingredients*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('IngredientList', slots, []);
    	let { amounts, ingredients } = $$props;
    	const writable_props = ['amounts', 'ingredients'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<IngredientList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('amounts' in $$props) $$invalidate(0, amounts = $$props.amounts);
    		if ('ingredients' in $$props) $$invalidate(1, ingredients = $$props.ingredients);
    	};

    	$$self.$capture_state = () => ({ Ingredient, amounts, ingredients });

    	$$self.$inject_state = $$props => {
    		if ('amounts' in $$props) $$invalidate(0, amounts = $$props.amounts);
    		if ('ingredients' in $$props) $$invalidate(1, ingredients = $$props.ingredients);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [amounts, ingredients];
    }

    class IngredientList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { amounts: 0, ingredients: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IngredientList",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*amounts*/ ctx[0] === undefined && !('amounts' in props)) {
    			console.warn("<IngredientList> was created without expected prop 'amounts'");
    		}

    		if (/*ingredients*/ ctx[1] === undefined && !('ingredients' in props)) {
    			console.warn("<IngredientList> was created without expected prop 'ingredients'");
    		}
    	}

    	get amounts() {
    		throw new Error("<IngredientList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set amounts(value) {
    		throw new Error("<IngredientList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ingredients() {
    		throw new Error("<IngredientList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ingredients(value) {
    		throw new Error("<IngredientList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/recipe_page/TimingAndServings.svelte generated by Svelte v3.44.0 */
    const file$7 = "src/components/recipe_page/TimingAndServings.svelte";

    function create_fragment$7(ctx) {
    	let div7;
    	let div6;
    	let div0;
    	let texticon0;
    	let t0;
    	let div5;
    	let div4;
    	let div1;
    	let buttonicon0;
    	let t1;
    	let div2;
    	let texticon1;
    	let t2;
    	let div3;
    	let buttonicon1;
    	let current;

    	texticon0 = new TextIcon({
    			props: {
    				icon: "fa-clock",
    				label: /*time*/ ctx[0] + (/*time*/ ctx[0] === 1 ? ' Minute' : ' Minutes')
    			},
    			$$inline: true
    		});

    	buttonicon0 = new ButtonIcon({
    			props: {
    				icon: "fa-minus",
    				handleClick: /*func*/ ctx[3]
    			},
    			$$inline: true
    		});

    	texticon1 = new TextIcon({
    			props: {
    				icon: "fa-user-friends",
    				label: /*servings*/ ctx[1] + (/*servings*/ ctx[1] === 1 ? ' Serving' : ' Servings')
    			},
    			$$inline: true
    		});

    	buttonicon1 = new ButtonIcon({
    			props: {
    				icon: "fa-plus",
    				handleClick: /*func_1*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			create_component(texticon0.$$.fragment);
    			t0 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			create_component(buttonicon0.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			create_component(texticon1.$$.fragment);
    			t2 = space();
    			div3 = element("div");
    			create_component(buttonicon1.$$.fragment);
    			attr_dev(div0, "class", "column has-text-centered");
    			add_location(div0, file$7, 19, 2, 471);
    			attr_dev(div1, "class", "column has-text-centered");
    			add_location(div1, file$7, 26, 4, 754);
    			attr_dev(div2, "class", "column is-half has-text-centered");
    			add_location(div2, file$7, 30, 4, 886);
    			attr_dev(div3, "class", "column has-text-centered");
    			add_location(div3, file$7, 34, 4, 1055);
    			attr_dev(div4, "class", "columns is-mobile is-vcentered is-centered has-no-margin svelte-9wwksp");
    			add_location(div4, file$7, 23, 3, 671);
    			attr_dev(div5, "class", "column is-two-thirds-tablet has-text-centered");
    			add_location(div5, file$7, 22, 2, 608);
    			attr_dev(div6, "class", "columns is-multiline is-vcentered is-centered has-no-margin svelte-9wwksp");
    			add_location(div6, file$7, 18, 1, 395);
    			attr_dev(div7, "class", "container block");
    			add_location(div7, file$7, 17, 0, 364);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			mount_component(texticon0, div0, null);
    			append_dev(div6, t0);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			mount_component(buttonicon0, div1, null);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			mount_component(texticon1, div2, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			mount_component(buttonicon1, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const texticon0_changes = {};
    			if (dirty & /*time*/ 1) texticon0_changes.label = /*time*/ ctx[0] + (/*time*/ ctx[0] === 1 ? ' Minute' : ' Minutes');
    			texticon0.$set(texticon0_changes);
    			const texticon1_changes = {};
    			if (dirty & /*servings*/ 2) texticon1_changes.label = /*servings*/ ctx[1] + (/*servings*/ ctx[1] === 1 ? ' Serving' : ' Servings');
    			texticon1.$set(texticon1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(texticon0.$$.fragment, local);
    			transition_in(buttonicon0.$$.fragment, local);
    			transition_in(texticon1.$$.fragment, local);
    			transition_in(buttonicon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(texticon0.$$.fragment, local);
    			transition_out(buttonicon0.$$.fragment, local);
    			transition_out(texticon1.$$.fragment, local);
    			transition_out(buttonicon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(texticon0);
    			destroy_component(buttonicon0);
    			destroy_component(texticon1);
    			destroy_component(buttonicon1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TimingAndServings', slots, []);
    	let { time = 60, servings = 4 } = $$props;
    	const dispatcher = createEventDispatcher();

    	const handleServings = x => {
    		dispatcher('variation', { variation: x });
    	};

    	const writable_props = ['time', 'servings'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimingAndServings> was created with unknown prop '${key}'`);
    	});

    	const func = () => handleServings(-1);
    	const func_1 = () => handleServings(+1);

    	$$self.$$set = $$props => {
    		if ('time' in $$props) $$invalidate(0, time = $$props.time);
    		if ('servings' in $$props) $$invalidate(1, servings = $$props.servings);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ButtonIcon,
    		TextIcon,
    		time,
    		servings,
    		dispatcher,
    		handleServings
    	});

    	$$self.$inject_state = $$props => {
    		if ('time' in $$props) $$invalidate(0, time = $$props.time);
    		if ('servings' in $$props) $$invalidate(1, servings = $$props.servings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [time, servings, handleServings, func, func_1];
    }

    class TimingAndServings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { time: 0, servings: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimingAndServings",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get time() {
    		throw new Error("<TimingAndServings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error("<TimingAndServings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get servings() {
    		throw new Error("<TimingAndServings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set servings(value) {
    		throw new Error("<TimingAndServings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/recipe_page/TitleAndAddBookmark.svelte generated by Svelte v3.44.0 */
    const file$6 = "src/components/recipe_page/TitleAndAddBookmark.svelte";

    function create_fragment$6(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let p;
    	let t0;
    	let t1;
    	let div1;
    	let buttonicon;
    	let current;

    	buttonicon = new ButtonIcon({
    			props: {
    				icon: "fa-bookmark",
    				is_icon_full: /*is_added_to_bookmarks*/ ctx[0],
    				label: /*is_added_to_bookmarks*/ ctx[0]
    				? "Added to Bookmarks"
    				: "Add to Bookmarks",
    				handleClick: /*func*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			create_component(buttonicon.$$.fragment);
    			attr_dev(p, "class", "title is-ubuntu");
    			add_location(p, file$6, 24, 3, 562);
    			attr_dev(div0, "class", "column is-half has-text-centered");
    			add_location(div0, file$6, 23, 2, 512);
    			attr_dev(div1, "class", "column is-half has-text-centered");
    			add_location(div1, file$6, 26, 2, 612);
    			attr_dev(div2, "class", "columns is-multiline is-vcentered is-centered");
    			add_location(div2, file$6, 22, 1, 450);
    			attr_dev(div3, "class", "container block");
    			add_location(div3, file$6, 21, 0, 419);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(buttonicon, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);
    			const buttonicon_changes = {};
    			if (dirty & /*is_added_to_bookmarks*/ 1) buttonicon_changes.is_icon_full = /*is_added_to_bookmarks*/ ctx[0];

    			if (dirty & /*is_added_to_bookmarks*/ 1) buttonicon_changes.label = /*is_added_to_bookmarks*/ ctx[0]
    			? "Added to Bookmarks"
    			: "Add to Bookmarks";

    			buttonicon.$set(buttonicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(buttonicon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TitleAndAddBookmark', slots, []);
    	let { title, id } = $$props;
    	let { is_added_to_bookmarks = false } = $$props;
    	const dispatcher = createEventDispatcher();

    	const handleAddRemove = () => {
    		$$invalidate(0, is_added_to_bookmarks = !is_added_to_bookmarks);
    		dispatcher("addRemove", { id, add_remove: is_added_to_bookmarks });
    	};

    	const writable_props = ['title', 'id', 'is_added_to_bookmarks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TitleAndAddBookmark> was created with unknown prop '${key}'`);
    	});

    	const func = () => handleAddRemove();

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('id' in $$props) $$invalidate(3, id = $$props.id);
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ButtonIcon,
    		title,
    		id,
    		is_added_to_bookmarks,
    		dispatcher,
    		handleAddRemove
    	});

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('id' in $$props) $$invalidate(3, id = $$props.id);
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [is_added_to_bookmarks, title, handleAddRemove, id, func];
    }

    class TitleAndAddBookmark extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			title: 1,
    			id: 3,
    			is_added_to_bookmarks: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TitleAndAddBookmark",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<TitleAndAddBookmark> was created without expected prop 'title'");
    		}

    		if (/*id*/ ctx[3] === undefined && !('id' in props)) {
    			console.warn("<TitleAndAddBookmark> was created without expected prop 'id'");
    		}
    	}

    	get title() {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_added_to_bookmarks() {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_added_to_bookmarks(value) {
    		throw new Error("<TitleAndAddBookmark>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/recipe_page/Recipe.svelte generated by Svelte v3.44.0 */
    const file$5 = "src/components/recipe_page/Recipe.svelte";

    function create_fragment$5(ctx) {
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let titleandaddbookmark;
    	let t1;
    	let timingandservings;
    	let t2;
    	let nav0;
    	let t3;
    	let ingredientlist;
    	let t4;
    	let nav1;
    	let t5;
    	let div0;
    	let buttonicon;
    	let current;

    	titleandaddbookmark = new TitleAndAddBookmark({
    			props: {
    				title: /*recipe*/ ctx[1].title,
    				id: /*recipe*/ ctx[1].recipe_id,
    				is_added_to_bookmarks: /*is_added_to_bookmarks*/ ctx[0]
    			},
    			$$inline: true
    		});

    	titleandaddbookmark.$on("addRemove", /*handleBookmarks*/ ctx[4]);

    	timingandservings = new TimingAndServings({
    			props: {
    				time: /*func*/ ctx[8](),
    				servings: /*servings*/ ctx[2]
    			},
    			$$inline: true
    		});

    	timingandservings.$on("variation", /*handleServings*/ ctx[6]);

    	ingredientlist = new IngredientList({
    			props: {
    				ingredients: /*ingredients*/ ctx[5],
    				amounts: /*amounts_fracted*/ ctx[3]
    			},
    			$$inline: true
    		});

    	buttonicon = new ButtonIcon({
    			props: {
    				icon: "fa-hat-chef",
    				label: "How to cook",
    				icon_right: true,
    				handleClick: /*func_1*/ ctx[9]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			create_component(titleandaddbookmark.$$.fragment);
    			t1 = space();
    			create_component(timingandservings.$$.fragment);
    			t2 = space();
    			nav0 = element("nav");
    			t3 = space();
    			create_component(ingredientlist.$$.fragment);
    			t4 = space();
    			nav1 = element("nav");
    			t5 = space();
    			div0 = element("div");
    			create_component(buttonicon.$$.fragment);
    			attr_dev(img, "alt", "immagine ricetta");
    			attr_dev(img, "class", "image-recipe svelte-rdy6no");
    			if (!src_url_equal(img.src, img_src_value = /*recipe*/ ctx[1].image_url)) attr_dev(img, "src", img_src_value);
    			add_location(img, file$5, 147, 5, 5087);
    			attr_dev(figure, "class", "image is-3by2 block");
    			add_location(figure, file$5, 146, 4, 5045);
    			attr_dev(nav0, "class", "level line svelte-rdy6no");
    			add_location(nav0, file$5, 170, 4, 5648);
    			attr_dev(nav1, "class", "level line svelte-rdy6no");
    			add_location(nav1, file$5, 172, 4, 5754);
    			attr_dev(div0, "class", "container has-text-centered pb-5");
    			add_location(div0, file$5, 173, 4, 5785);
    			attr_dev(div1, "class", "column is-centered is-vcentered box has-no-padding svelte-rdy6no");
    			add_location(div1, file$5, 145, 3, 4976);
    			attr_dev(div2, "class", "column is-two-thirds-tablet");
    			add_location(div2, file$5, 144, 2, 4931);
    			attr_dev(div3, "class", "columns is-centered is-vcentered");
    			add_location(div3, file$5, 143, 1, 4882);
    			attr_dev(div4, "class", "container block");
    			add_location(div4, file$5, 142, 0, 4851);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, figure);
    			append_dev(figure, img);
    			append_dev(div1, t0);
    			mount_component(titleandaddbookmark, div1, null);
    			append_dev(div1, t1);
    			mount_component(timingandservings, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, nav0);
    			append_dev(div1, t3);
    			mount_component(ingredientlist, div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, nav1);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			mount_component(buttonicon, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*recipe*/ 2 && !src_url_equal(img.src, img_src_value = /*recipe*/ ctx[1].image_url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			const titleandaddbookmark_changes = {};
    			if (dirty & /*recipe*/ 2) titleandaddbookmark_changes.title = /*recipe*/ ctx[1].title;
    			if (dirty & /*recipe*/ 2) titleandaddbookmark_changes.id = /*recipe*/ ctx[1].recipe_id;
    			if (dirty & /*is_added_to_bookmarks*/ 1) titleandaddbookmark_changes.is_added_to_bookmarks = /*is_added_to_bookmarks*/ ctx[0];
    			titleandaddbookmark.$set(titleandaddbookmark_changes);
    			const timingandservings_changes = {};
    			if (dirty & /*recipe*/ 2) timingandservings_changes.time = /*func*/ ctx[8]();
    			if (dirty & /*servings*/ 4) timingandservings_changes.servings = /*servings*/ ctx[2];
    			timingandservings.$set(timingandservings_changes);
    			const ingredientlist_changes = {};
    			if (dirty & /*amounts_fracted*/ 8) ingredientlist_changes.amounts = /*amounts_fracted*/ ctx[3];
    			ingredientlist.$set(ingredientlist_changes);
    			const buttonicon_changes = {};
    			if (dirty & /*recipe*/ 2) buttonicon_changes.handleClick = /*func_1*/ ctx[9];
    			buttonicon.$set(buttonicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titleandaddbookmark.$$.fragment, local);
    			transition_in(timingandservings.$$.fragment, local);
    			transition_in(ingredientlist.$$.fragment, local);
    			transition_in(buttonicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titleandaddbookmark.$$.fragment, local);
    			transition_out(timingandservings.$$.fragment, local);
    			transition_out(ingredientlist.$$.fragment, local);
    			transition_out(buttonicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(titleandaddbookmark);
    			destroy_component(timingandservings);
    			destroy_component(ingredientlist);
    			destroy_component(buttonicon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Recipe', slots, []);
    	let { is_added_to_bookmarks } = $$props;
    	let { recipe } = $$props;

    	const getingredients = list_ingredients => {
    		let recipe_ingredients = list_ingredients, new_ingredients = [];

    		for (let ingredient of recipe_ingredients) {
    			let ingredient_string = ingredient;
    			let array = ingredient_string.substring(0, 5).match(/\d+/g);

    			if (array) {
    				let ounces = ingredient_string.match(/\((\d+)?(.+)?(\d+)\s+\w+\)/g);
    				if (ounces) ingredient_string = ingredient_string.replace(ounces.toString(), "");

    				switch (array.length) {
    					case 1:
    						new_ingredients.push(ingredient_string.substring(array.length));
    						break;
    					case 2:
    						new_ingredients.push(ingredient_string.substring(array.length + 1));
    						break;
    					case 3:
    						new_ingredients.push(ingredient_string.substring(array.length + 2));
    						break;
    					default:
    						new_ingredients.push(ingredient_string);
    						break;
    				}
    			} else new_ingredients.push(ingredient_string);
    		}

    		return new_ingredients;
    	};

    	let servings = 4; //Non presente nelle API, default 4
    	const dispatcher = createEventDispatcher();

    	const handleBookmarks = event => {
    		let recipe_id = event.detail.id;

    		if (event.detail.add_remove) {
    			dispatcher("addBookmark", { id: recipe_id });
    		} else {
    			dispatcher("removeBookmark", { id: recipe_id });
    		}
    	};

    	const getAmounts = list_ingredients => {
    		let recipe_ingredients = list_ingredients, new_amounts = [];

    		for (let ingredient of recipe_ingredients) {
    			let ingredient_string = ingredient;
    			let array = ingredient_string.substring(0, 5).match(/\d+/g);
    			let a, b, c, d;

    			if (array) {
    				switch (array.length) {
    					case 1:
    						[a] = array;
    						new_amounts.push(parseFloat(a));
    						break;
    					case 2:
    						[a, b] = array;
    						a = parseFloat(a);
    						b = parseFloat(b);
    						d = a / b;
    						new_amounts.push(d);
    						break;
    					case 3:
    						[a, b, c] = array;
    						a = parseFloat(a);
    						b = parseFloat(b);
    						c = parseFloat(c);
    						d = a + b / c;
    						new_amounts.push(d);
    						break;
    					default:
    						new_amounts.push(0);
    						break;
    				}
    			} else {
    				new_amounts.push(0);
    			}
    		}

    		return new_amounts;
    	};

    	let gcd = (a, b) => {
    		if (b < 0.0000001) return a;
    		return gcd(b, Math.floor(a % b));
    	};

    	let getFraction = fraction => {
    		let len = fraction.toString().length - 2;
    		let denominator = Math.pow(10, len);
    		let numerator = fraction * denominator;
    		let divisor = gcd(numerator, denominator); // Should be 5
    		numerator /= divisor; // Should be 687
    		denominator /= divisor; // Should be 2000
    		return Math.floor(numerator) + "/" + Math.floor(denominator);
    	};

    	const getAmountsFracted = amounts => {
    		let fraction_amounts = [];

    		for (let amount of amounts) {
    			amount = amount * servings / 4;

    			if (amount != 0 && amount % 1 != 0.0) {
    				if (Math.floor(amount) == 0) {
    					fraction_amounts.push(getFraction(amount % 1));
    				} else fraction_amounts.push(Math.floor(amount) + " " + getFraction(amount % 1));
    			} else if (amount != 0) {
    				fraction_amounts.push(amount);
    			} else fraction_amounts.push("");
    		}

    		return fraction_amounts;
    	};

    	let amounts = getAmounts(recipe.ingredients),
    		amounts_fracted = getAmountsFracted(amounts),
    		ingredients = getingredients(recipe.ingredients);

    	const handleServings = event => {
    		$$invalidate(2, servings = servings + event.detail.variation);
    		if (servings < 1) $$invalidate(2, servings = 1);
    		amounts = getAmounts(recipe.ingredients);
    		$$invalidate(3, amounts_fracted = getAmountsFracted(amounts));
    	};

    	let seed = 0;
    	let modulus = 2 ** 32;
    	let a = 1664525;
    	let c = 1013904223;

    	function getRandom(seed) {
    		let returnVal = seed / modulus;
    		seed = (a * seed + c) % modulus;
    		return returnVal;
    	}

    	const writable_props = ['is_added_to_bookmarks', 'recipe'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Recipe> was created with unknown prop '${key}'`);
    	});

    	const func = () => {
    		let time = Math.ceil(10 ** 7 * getRandom(recipe.recipe_id));
    		return time;
    	};

    	const func_1 = () => {
    		window.open(recipe.source_url, "_blank");
    	};

    	$$self.$$set = $$props => {
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    		if ('recipe' in $$props) $$invalidate(1, recipe = $$props.recipe);
    	};

    	$$self.$capture_state = () => ({
    		IngredientList,
    		ButtonIcon,
    		TimingAndServings,
    		TitleAndAddBookmark,
    		createEventDispatcher,
    		is_added_to_bookmarks,
    		recipe,
    		getingredients,
    		servings,
    		dispatcher,
    		handleBookmarks,
    		getAmounts,
    		gcd,
    		getFraction,
    		getAmountsFracted,
    		amounts,
    		amounts_fracted,
    		ingredients,
    		handleServings,
    		seed,
    		modulus,
    		a,
    		c,
    		getRandom
    	});

    	$$self.$inject_state = $$props => {
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    		if ('recipe' in $$props) $$invalidate(1, recipe = $$props.recipe);
    		if ('servings' in $$props) $$invalidate(2, servings = $$props.servings);
    		if ('gcd' in $$props) gcd = $$props.gcd;
    		if ('getFraction' in $$props) getFraction = $$props.getFraction;
    		if ('amounts' in $$props) amounts = $$props.amounts;
    		if ('amounts_fracted' in $$props) $$invalidate(3, amounts_fracted = $$props.amounts_fracted);
    		if ('ingredients' in $$props) $$invalidate(5, ingredients = $$props.ingredients);
    		if ('seed' in $$props) seed = $$props.seed;
    		if ('modulus' in $$props) modulus = $$props.modulus;
    		if ('a' in $$props) a = $$props.a;
    		if ('c' in $$props) c = $$props.c;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		is_added_to_bookmarks,
    		recipe,
    		servings,
    		amounts_fracted,
    		handleBookmarks,
    		ingredients,
    		handleServings,
    		getRandom,
    		func,
    		func_1
    	];
    }

    class Recipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { is_added_to_bookmarks: 0, recipe: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Recipe",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*is_added_to_bookmarks*/ ctx[0] === undefined && !('is_added_to_bookmarks' in props)) {
    			console.warn("<Recipe> was created without expected prop 'is_added_to_bookmarks'");
    		}

    		if (/*recipe*/ ctx[1] === undefined && !('recipe' in props)) {
    			console.warn("<Recipe> was created without expected prop 'recipe'");
    		}
    	}

    	get is_added_to_bookmarks() {
    		throw new Error("<Recipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_added_to_bookmarks(value) {
    		throw new Error("<Recipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get recipe() {
    		throw new Error("<Recipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set recipe(value) {
    		throw new Error("<Recipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/list_page/ListedRecipe.svelte generated by Svelte v3.44.0 */
    const file$4 = "src/components/list_page/ListedRecipe.svelte";

    function create_fragment$4(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let p0;
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let t4;
    	let div2;
    	let buttonicon;
    	let div4_transition;
    	let current;
    	let mounted;
    	let dispose;

    	buttonicon = new ButtonIcon({
    			props: {
    				icon: "fa-bookmark",
    				is_icon_full: /*is_added_to_bookmarks*/ ctx[0],
    				handleClick: /*func*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(/*subtitle*/ ctx[2]);
    			t4 = space();
    			div2 = element("div");
    			create_component(buttonicon.$$.fragment);
    			attr_dev(img, "alt", /*title*/ ctx[1]);
    			attr_dev(img, "class", "has-border-left-radius-special has-max-height-card-image svelte-11otswf");
    			if (!src_url_equal(img.src, img_src_value = /*image_src*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			add_location(img, file$4, 36, 4, 881);
    			attr_dev(figure, "class", "image has-fit-cover svelte-11otswf");
    			add_location(figure, file$4, 35, 3, 840);
    			attr_dev(div0, "class", "column is-5 has-no-padding svelte-11otswf");
    			add_location(div0, file$4, 34, 2, 773);
    			attr_dev(p0, "class", "subtitle has-text-weight-bold");
    			add_location(p0, file$4, 44, 3, 1110);
    			attr_dev(p1, "class", "subtitle is-ubuntu");
    			add_location(p1, file$4, 45, 3, 1166);
    			attr_dev(div1, "class", "column is-5 has-no-padding has-text-centered svelte-11otswf");
    			add_location(div1, file$4, 43, 2, 1025);
    			attr_dev(div2, "class", "column is-2 has-no-padding has-text-centered svelte-11otswf");
    			add_location(div2, file$4, 47, 2, 1222);
    			attr_dev(div3, "class", "columns is-mobile is-vcentered has-box-sizing-for-image has-no-margin svelte-11otswf");
    			add_location(div3, file$4, 31, 1, 683);
    			attr_dev(div4, "class", "box container has-no-padding block svelte-11otswf");
    			add_location(div4, file$4, 30, 0, 617);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, figure);
    			append_dev(figure, img);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(p1, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(buttonicon, div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*handleClick*/ ctx[5], false, false, false),
    					listen_dev(div1, "click", /*handleClick*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 2) {
    				attr_dev(img, "alt", /*title*/ ctx[1]);
    			}

    			if (!current || dirty & /*image_src*/ 8 && !src_url_equal(img.src, img_src_value = /*image_src*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (!current || dirty & /*subtitle*/ 4) set_data_dev(t3, /*subtitle*/ ctx[2]);
    			const buttonicon_changes = {};
    			if (dirty & /*is_added_to_bookmarks*/ 1) buttonicon_changes.is_icon_full = /*is_added_to_bookmarks*/ ctx[0];
    			buttonicon.$set(buttonicon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonicon.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, {}, true);
    				div4_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonicon.$$.fragment, local);
    			if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, {}, false);
    			div4_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(buttonicon);
    			if (detaching && div4_transition) div4_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ListedRecipe', slots, []);
    	let { id, title, subtitle, image_src } = $$props;
    	let { is_added_to_bookmarks = false } = $$props;
    	const dispatcher = createEventDispatcher();

    	const handleAddRemove = () => {
    		$$invalidate(0, is_added_to_bookmarks = !is_added_to_bookmarks);
    		dispatcher("addRemove", { id, add_remove: is_added_to_bookmarks });
    	};

    	const handleClick = () => {
    		dispatcher('open', { recipe_id: id });
    	};

    	const writable_props = ['id', 'title', 'subtitle', 'image_src', 'is_added_to_bookmarks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ListedRecipe> was created with unknown prop '${key}'`);
    	});

    	const func = () => handleAddRemove();

    	$$self.$$set = $$props => {
    		if ('id' in $$props) $$invalidate(6, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate(2, subtitle = $$props.subtitle);
    		if ('image_src' in $$props) $$invalidate(3, image_src = $$props.image_src);
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    	};

    	$$self.$capture_state = () => ({
    		ButtonIcon,
    		fade,
    		createEventDispatcher,
    		Recipe,
    		id,
    		title,
    		subtitle,
    		image_src,
    		is_added_to_bookmarks,
    		dispatcher,
    		handleAddRemove,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('id' in $$props) $$invalidate(6, id = $$props.id);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate(2, subtitle = $$props.subtitle);
    		if ('image_src' in $$props) $$invalidate(3, image_src = $$props.image_src);
    		if ('is_added_to_bookmarks' in $$props) $$invalidate(0, is_added_to_bookmarks = $$props.is_added_to_bookmarks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		is_added_to_bookmarks,
    		title,
    		subtitle,
    		image_src,
    		handleAddRemove,
    		handleClick,
    		id,
    		func
    	];
    }

    class ListedRecipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			id: 6,
    			title: 1,
    			subtitle: 2,
    			image_src: 3,
    			is_added_to_bookmarks: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListedRecipe",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[6] === undefined && !('id' in props)) {
    			console.warn("<ListedRecipe> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<ListedRecipe> was created without expected prop 'title'");
    		}

    		if (/*subtitle*/ ctx[2] === undefined && !('subtitle' in props)) {
    			console.warn("<ListedRecipe> was created without expected prop 'subtitle'");
    		}

    		if (/*image_src*/ ctx[3] === undefined && !('image_src' in props)) {
    			console.warn("<ListedRecipe> was created without expected prop 'image_src'");
    		}
    	}

    	get id() {
    		throw new Error("<ListedRecipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ListedRecipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ListedRecipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ListedRecipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtitle() {
    		throw new Error("<ListedRecipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtitle(value) {
    		throw new Error("<ListedRecipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get image_src() {
    		throw new Error("<ListedRecipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image_src(value) {
    		throw new Error("<ListedRecipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_added_to_bookmarks() {
    		throw new Error("<ListedRecipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_added_to_bookmarks(value) {
    		throw new Error("<ListedRecipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/list_page/Pagination.svelte generated by Svelte v3.44.0 */
    const file$3 = "src/components/list_page/Pagination.svelte";

    function create_fragment$3(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let buttonicon0;
    	let t0;
    	let div1;
    	let p;
    	let t1_value = /*page*/ ctx[0] + 1 + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div2;
    	let buttonicon1;
    	let current;

    	buttonicon0 = new ButtonIcon({
    			props: {
    				icon: "fa-chevron-left",
    				label: "Previous",
    				handleClick: /*func*/ ctx[3]
    			},
    			$$inline: true
    		});

    	buttonicon1 = new ButtonIcon({
    			props: {
    				icon: "fa-chevron-right",
    				label: "Next",
    				icon_right: true,
    				handleClick: /*func_1*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			create_component(buttonicon0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = text(" / ");
    			t3 = text(/*out_of*/ ctx[1]);
    			t4 = space();
    			div2 = element("div");
    			create_component(buttonicon1.$$.fragment);
    			attr_dev(div0, "class", "column has-text-left");
    			add_location(div0, file$3, 18, 2, 367);
    			attr_dev(p, "class", "subtitle is-ubuntu");
    			add_location(p, file$3, 26, 3, 572);
    			attr_dev(div1, "class", "column has-text-centered");
    			add_location(div1, file$3, 25, 2, 530);
    			attr_dev(div2, "class", "column has-text-right");
    			add_location(div2, file$3, 28, 2, 639);
    			attr_dev(div3, "class", "columns is-vcentered is-mobile");
    			add_location(div3, file$3, 17, 1, 320);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$3, 16, 0, 295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			mount_component(buttonicon0, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			mount_component(buttonicon1, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*page*/ 1) && t1_value !== (t1_value = /*page*/ ctx[0] + 1 + "")) set_data_dev(t1, t1_value);
    			if (!current || dirty & /*out_of*/ 2) set_data_dev(t3, /*out_of*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonicon0.$$.fragment, local);
    			transition_in(buttonicon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonicon0.$$.fragment, local);
    			transition_out(buttonicon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(buttonicon0);
    			destroy_component(buttonicon1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pagination', slots, []);
    	let { page, out_of } = $$props;
    	const dispatcher = createEventDispatcher();

    	const handleVariation = x => {
    		dispatcher("variation", { variation: x });
    	};

    	const writable_props = ['page', 'out_of'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	const func = () => handleVariation(-1);
    	const func_1 = () => handleVariation(1);

    	$$self.$$set = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    		if ('out_of' in $$props) $$invalidate(1, out_of = $$props.out_of);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ButtonIcon,
    		page,
    		out_of,
    		dispatcher,
    		handleVariation
    	});

    	$$self.$inject_state = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    		if ('out_of' in $$props) $$invalidate(1, out_of = $$props.out_of);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, out_of, handleVariation, func, func_1];
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { page: 0, out_of: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[0] === undefined && !('page' in props)) {
    			console.warn("<Pagination> was created without expected prop 'page'");
    		}

    		if (/*out_of*/ ctx[1] === undefined && !('out_of' in props)) {
    			console.warn("<Pagination> was created without expected prop 'out_of'");
    		}
    	}

    	get page() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get out_of() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set out_of(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/list_page/RecipeList.svelte generated by Svelte v3.44.0 */
    const file$2 = "src/components/list_page/RecipeList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (49:3) {#each recipes_showed as recipe}
    function create_each_block(ctx) {
    	let listedrecipe;
    	let current;

    	listedrecipe = new ListedRecipe({
    			props: {
    				id: /*recipe*/ ctx[9].recipe_id,
    				title: /*recipe*/ ctx[9].title,
    				subtitle: /*recipe*/ ctx[9].publisher,
    				is_added_to_bookmarks: /*bookmarks*/ ctx[1].includes(/*recipe*/ ctx[9].recipe_id),
    				image_src: /*recipe*/ ctx[9].image_url
    			},
    			$$inline: true
    		});

    	listedrecipe.$on("addRemove", /*handleBookmarks*/ ctx[6]);
    	listedrecipe.$on("open", /*handleOpen*/ ctx[7]);

    	const block = {
    		c: function create() {
    			create_component(listedrecipe.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(listedrecipe, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listedrecipe_changes = {};
    			if (dirty & /*recipes_showed*/ 8) listedrecipe_changes.id = /*recipe*/ ctx[9].recipe_id;
    			if (dirty & /*recipes_showed*/ 8) listedrecipe_changes.title = /*recipe*/ ctx[9].title;
    			if (dirty & /*recipes_showed*/ 8) listedrecipe_changes.subtitle = /*recipe*/ ctx[9].publisher;
    			if (dirty & /*bookmarks, recipes_showed*/ 10) listedrecipe_changes.is_added_to_bookmarks = /*bookmarks*/ ctx[1].includes(/*recipe*/ ctx[9].recipe_id);
    			if (dirty & /*recipes_showed*/ 8) listedrecipe_changes.image_src = /*recipe*/ ctx[9].image_url;
    			listedrecipe.$set(listedrecipe_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listedrecipe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listedrecipe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listedrecipe, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(49:3) {#each recipes_showed as recipe}",
    		ctx
    	});

    	return block;
    }

    // (63:3) {:else}
    function create_else_block(ctx) {
    	let div;
    	let texticon;
    	let current;

    	texticon = new TextIcon({
    			props: {
    				label: "There are no recipes here",
    				icon: "fa-empty-set"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(texticon.$$.fragment);
    			attr_dev(div, "class", "box has-text-centered");
    			add_location(div, file$2, 63, 4, 1629);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(texticon, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(texticon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(texticon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(texticon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(63:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:3) {#if recipes.length != 0}
    function create_if_block$1(ctx) {
    	let pagination;
    	let current;

    	pagination = new Pagination({
    			props: {
    				page: /*page*/ ctx[2],
    				out_of: /*out_of*/ ctx[4]
    			},
    			$$inline: true
    		});

    	pagination.$on("variation", /*handleVariation*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(pagination.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pagination, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pagination_changes = {};
    			if (dirty & /*page*/ 4) pagination_changes.page = /*page*/ ctx[2];
    			if (dirty & /*out_of*/ 16) pagination_changes.out_of = /*out_of*/ ctx[4];
    			pagination.$set(pagination_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagination.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pagination, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(61:3) {#if recipes.length != 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let each_value = /*recipes_showed*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*recipes*/ ctx[0].length != 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if_block.c();
    			attr_dev(div0, "class", "column is-two-thirds-tablet");
    			add_location(div0, file$2, 47, 2, 1119);
    			attr_dev(div1, "class", "columns is-centered is-fullwidth");
    			add_location(div1, file$2, 46, 1, 1070);
    			attr_dev(div2, "class", "container block");
    			add_location(div2, file$2, 45, 0, 1039);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div0, t);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*recipes_showed, bookmarks, handleBookmarks, handleOpen*/ 202) {
    				each_value = /*recipes_showed*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, t);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let page;
    	let out_of;
    	let recipes_showed;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RecipeList', slots, []);
    	let { recipes = [] } = $$props;
    	let { bookmarks } = $$props;

    	const handleVariation = event => {
    		$$invalidate(2, page += event.detail.variation);
    		if (page < 0) $$invalidate(2, page = 0);
    		if (page >= out_of - 1) $$invalidate(2, page = out_of - 1);
    		$$invalidate(3, recipes_showed = recipes.slice(page * 5, (page + 1) * 5));
    	};

    	const dispatcher = createEventDispatcher();

    	const handleBookmarks = event => {
    		let recipe_id = event.detail.id;

    		if (event.detail.add_remove) {
    			dispatcher("addBookmark", { id: recipe_id });
    		} else {
    			dispatcher("removeBookmark", { id: recipe_id });
    		}
    	};

    	const handleOpen = event => {
    		let recipe_to_open = event.detail.recipe_id;
    		dispatcher('openRecipe', { recipe: recipe_to_open });
    	};

    	const writable_props = ['recipes', 'bookmarks'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RecipeList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('recipes' in $$props) $$invalidate(0, recipes = $$props.recipes);
    		if ('bookmarks' in $$props) $$invalidate(1, bookmarks = $$props.bookmarks);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		TextIcon,
    		ListedRecipe,
    		Pagination,
    		recipes,
    		bookmarks,
    		handleVariation,
    		dispatcher,
    		handleBookmarks,
    		handleOpen,
    		page,
    		recipes_showed,
    		out_of
    	});

    	$$self.$inject_state = $$props => {
    		if ('recipes' in $$props) $$invalidate(0, recipes = $$props.recipes);
    		if ('bookmarks' in $$props) $$invalidate(1, bookmarks = $$props.bookmarks);
    		if ('page' in $$props) $$invalidate(2, page = $$props.page);
    		if ('recipes_showed' in $$props) $$invalidate(3, recipes_showed = $$props.recipes_showed);
    		if ('out_of' in $$props) $$invalidate(4, out_of = $$props.out_of);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*recipes*/ 1) {
    			$$invalidate(4, out_of = Math.ceil(recipes.length / 5));
    		}

    		if ($$self.$$.dirty & /*recipes, page*/ 5) {
    			$$invalidate(3, recipes_showed = recipes.slice(page * 5, (page + 1) * 5));
    		}
    	};

    	$$invalidate(2, page = 0);

    	return [
    		recipes,
    		bookmarks,
    		page,
    		recipes_showed,
    		out_of,
    		handleVariation,
    		handleBookmarks,
    		handleOpen
    	];
    }

    class RecipeList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { recipes: 0, bookmarks: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RecipeList",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*bookmarks*/ ctx[1] === undefined && !('bookmarks' in props)) {
    			console.warn("<RecipeList> was created without expected prop 'bookmarks'");
    		}
    	}

    	get recipes() {
    		throw new Error("<RecipeList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set recipes(value) {
    		throw new Error("<RecipeList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bookmarks() {
    		throw new Error("<RecipeList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookmarks(value) {
    		throw new Error("<RecipeList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Features.svelte generated by Svelte v3.44.0 */
    const file$1 = "src/components/Features.svelte";

    function create_fragment$1(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let buttonicon0;
    	let div0_class_value;
    	let t;
    	let div1;
    	let buttonicon1;
    	let div1_class_value;
    	let current;

    	buttonicon0 = new ButtonIcon({
    			props: {
    				icon: "fa-arrow-left",
    				label: "Go Back",
    				handleClick: /*handleOpenRecipe*/ ctx[4]
    			},
    			$$inline: true
    		});

    	buttonicon1 = new ButtonIcon({
    			props: {
    				icon: "fa-bookmark",
    				is_icon_full: /*open_bookmarks*/ ctx[0],
    				label: "Bookmarks",
    				icon_right: true,
    				handleClick: /*handleOpenBookmarks*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			create_component(buttonicon0.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(buttonicon1.$$.fragment);
    			attr_dev(div0, "class", div0_class_value = "column has-text-centered " + (/*is_back_hidden*/ ctx[1] ? "is-hidden" : ""));
    			add_location(div0, file$1, 26, 2, 719);
    			attr_dev(div1, "class", div1_class_value = "column has-text-centered " + (/*is_bookmarks_hidden*/ ctx[2] ? "is-hidden" : ""));
    			add_location(div1, file$1, 29, 2, 895);
    			attr_dev(div2, "class", "columns is-mobile is-centered is-vcentered");
    			add_location(div2, file$1, 22, 1, 507);
    			attr_dev(div3, "class", "container block");
    			add_location(div3, file$1, 21, 0, 476);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			mount_component(buttonicon0, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(buttonicon1, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*is_back_hidden*/ 2 && div0_class_value !== (div0_class_value = "column has-text-centered " + (/*is_back_hidden*/ ctx[1] ? "is-hidden" : ""))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			const buttonicon1_changes = {};
    			if (dirty & /*open_bookmarks*/ 1) buttonicon1_changes.is_icon_full = /*open_bookmarks*/ ctx[0];
    			buttonicon1.$set(buttonicon1_changes);

    			if (!current || dirty & /*is_bookmarks_hidden*/ 4 && div1_class_value !== (div1_class_value = "column has-text-centered " + (/*is_bookmarks_hidden*/ ctx[2] ? "is-hidden" : ""))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buttonicon0.$$.fragment, local);
    			transition_in(buttonicon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonicon0.$$.fragment, local);
    			transition_out(buttonicon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(buttonicon0);
    			destroy_component(buttonicon1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Features', slots, []);
    	let { open_bookmarks, is_back_hidden = true, is_bookmarks_hidden = false } = $$props;
    	const dispatcher = createEventDispatcher();

    	const handleOpenBookmarks = () => {
    		$$invalidate(0, open_bookmarks = !open_bookmarks);
    		dispatcher('openCloseBookmarks', { open_close: open_bookmarks });
    	};

    	const handleOpenRecipe = () => {
    		dispatcher('closeRecipe');
    	};

    	const writable_props = ['open_bookmarks', 'is_back_hidden', 'is_bookmarks_hidden'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Features> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('open_bookmarks' in $$props) $$invalidate(0, open_bookmarks = $$props.open_bookmarks);
    		if ('is_back_hidden' in $$props) $$invalidate(1, is_back_hidden = $$props.is_back_hidden);
    		if ('is_bookmarks_hidden' in $$props) $$invalidate(2, is_bookmarks_hidden = $$props.is_bookmarks_hidden);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ButtonIcon,
    		open_bookmarks,
    		is_back_hidden,
    		is_bookmarks_hidden,
    		dispatcher,
    		handleOpenBookmarks,
    		handleOpenRecipe
    	});

    	$$self.$inject_state = $$props => {
    		if ('open_bookmarks' in $$props) $$invalidate(0, open_bookmarks = $$props.open_bookmarks);
    		if ('is_back_hidden' in $$props) $$invalidate(1, is_back_hidden = $$props.is_back_hidden);
    		if ('is_bookmarks_hidden' in $$props) $$invalidate(2, is_bookmarks_hidden = $$props.is_bookmarks_hidden);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		open_bookmarks,
    		is_back_hidden,
    		is_bookmarks_hidden,
    		handleOpenBookmarks,
    		handleOpenRecipe
    	];
    }

    class Features extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			open_bookmarks: 0,
    			is_back_hidden: 1,
    			is_bookmarks_hidden: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Features",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*open_bookmarks*/ ctx[0] === undefined && !('open_bookmarks' in props)) {
    			console.warn("<Features> was created without expected prop 'open_bookmarks'");
    		}
    	}

    	get open_bookmarks() {
    		throw new Error("<Features>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open_bookmarks(value) {
    		throw new Error("<Features>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_back_hidden() {
    		throw new Error("<Features>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_back_hidden(value) {
    		throw new Error("<Features>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_bookmarks_hidden() {
    		throw new Error("<Features>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_bookmarks_hidden(value) {
    		throw new Error("<Features>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let bookmarks_stored = localStorage.getItem('bookmarks');
    if (!bookmarks_stored)
        bookmarks_stored = "[]";
    let bookmarks;
    try {
        bookmarks = writable(JSON.parse(bookmarks_stored));
    }
    catch (error) {
        bookmarks = writable([]);
    }
    if (bookmarks == undefined)
        bookmarks = writable([]);
    const bookmarks_store = bookmarks;
    bookmarks_store.subscribe((value) => localStorage.setItem('bookmarks', JSON.stringify(value)));

    const recipes_store = writable([]);

    /* src/App.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (130:44) 
    function create_if_block_3(ctx) {
    	let recipe;
    	let current;

    	recipe = new Recipe({
    			props: {
    				recipe: /*recipe_to_open*/ ctx[3],
    				is_added_to_bookmarks: /*bookmarks*/ ctx[0].includes(/*recipe_to_open*/ ctx[3].recipe_id)
    			},
    			$$inline: true
    		});

    	recipe.$on("addBookmark", /*addRecipeToBookmarks*/ ctx[10]);
    	recipe.$on("removeBookmark", /*removeFromBookmarks*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(recipe.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(recipe, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const recipe_changes = {};
    			if (dirty & /*recipe_to_open*/ 8) recipe_changes.recipe = /*recipe_to_open*/ ctx[3];
    			if (dirty & /*bookmarks, recipe_to_open*/ 9) recipe_changes.is_added_to_bookmarks = /*bookmarks*/ ctx[0].includes(/*recipe_to_open*/ ctx[3].recipe_id);
    			recipe.$set(recipe_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(recipe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(recipe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(recipe, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(130:44) ",
    		ctx
    	});

    	return block;
    }

    // (122:51) 
    function create_if_block_2(ctx) {
    	let recipelist;
    	let current;

    	recipelist = new RecipeList({
    			props: {
    				bookmarks: /*bookmarks*/ ctx[0],
    				recipes: /*recipes*/ ctx[2]
    			},
    			$$inline: true
    		});

    	recipelist.$on("addBookmark", /*addRecipeToBookmarks*/ ctx[10]);
    	recipelist.$on("removeBookmark", /*removeFromBookmarks*/ ctx[11]);
    	recipelist.$on("openRecipe", /*openRecipe*/ ctx[12]);

    	const block = {
    		c: function create() {
    			create_component(recipelist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(recipelist, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const recipelist_changes = {};
    			if (dirty & /*bookmarks*/ 1) recipelist_changes.bookmarks = /*bookmarks*/ ctx[0];
    			if (dirty & /*recipes*/ 4) recipelist_changes.recipes = /*recipes*/ ctx[2];
    			recipelist.$set(recipelist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(recipelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(recipelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(recipelist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(122:51) ",
    		ctx
    	});

    	return block;
    }

    // (114:4) {#if open_bookmarks && !open_recipe && bookmarks_recipes}
    function create_if_block_1(ctx) {
    	let recipelist;
    	let current;

    	recipelist = new RecipeList({
    			props: {
    				bookmarks: /*bookmarks*/ ctx[0],
    				recipes: /*bookmarks_recipes*/ ctx[1]
    			},
    			$$inline: true
    		});

    	recipelist.$on("addBookmark", /*addRecipeToBookmarks*/ ctx[10]);
    	recipelist.$on("removeBookmark", /*removeFromBookmarks*/ ctx[11]);
    	recipelist.$on("openRecipe", /*openRecipe*/ ctx[12]);

    	const block = {
    		c: function create() {
    			create_component(recipelist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(recipelist, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const recipelist_changes = {};
    			if (dirty & /*bookmarks*/ 1) recipelist_changes.bookmarks = /*bookmarks*/ ctx[0];
    			if (dirty & /*bookmarks_recipes*/ 2) recipelist_changes.recipes = /*bookmarks_recipes*/ ctx[1];
    			recipelist.$set(recipelist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(recipelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(recipelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(recipelist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(114:4) {#if open_bookmarks && !open_recipe && bookmarks_recipes}",
    		ctx
    	});

    	return block;
    }

    // (145:0) {#if notification}
    function create_if_block(ctx) {
    	let div;
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text("\n\t\tQuery not possible.");
    			attr_dev(button, "class", "delete");
    			add_location(button, file, 146, 2, 4468);
    			attr_dev(div, "class", "notification is-danger svelte-hrr44p");
    			add_location(div, file, 145, 1, 4429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*closeNotification*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(145:0) {#if notification}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let section1;
    	let div1;
    	let div0;
    	let section0;
    	let p;
    	let t1;
    	let searchbar;
    	let t2;
    	let features;
    	let t3;
    	let current_block_type_index;
    	let if_block0;
    	let t4;
    	let if_block1_anchor;
    	let current;
    	searchbar = new SearchBar({ $$inline: true });
    	searchbar.$on("search", /*handleSearching*/ ctx[16]);

    	features = new Features({
    			props: {
    				open_bookmarks: /*open_bookmarks*/ ctx[4],
    				is_back_hidden: /*is_back_hidden*/ ctx[7],
    				is_bookmarks_hidden: /*is_bookmarks_hidden*/ ctx[8]
    			},
    			$$inline: true
    		});

    	features.$on("closeRecipe", /*closeRecipe*/ ctx[13]);
    	features.$on("openCloseBookmarks", /*handleOpenCloseBookmarks*/ ctx[14]);
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*open_bookmarks*/ ctx[4] && !/*open_recipe*/ ctx[6] && /*bookmarks_recipes*/ ctx[1]) return 0;
    		if (/*searching*/ ctx[5] && !/*open_recipe*/ ctx[6] && /*recipes*/ ctx[2]) return 1;
    		if (/*open_recipe*/ ctx[6] && /*recipe_to_open*/ ctx[3]) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block1 = /*notification*/ ctx[9] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			section1 = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			section0 = element("section");
    			p = element("p");
    			p.textContent = "Receptacle.";
    			t1 = space();
    			create_component(searchbar.$$.fragment);
    			t2 = space();
    			create_component(features.$$.fragment);
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(p, "class", "title is-ubuntu has-text-black is-2 has-font-weigth-bold has-letters-spaced svelte-hrr44p");
    			add_location(p, file, 99, 5, 3218);
    			attr_dev(section0, "class", "container has-text-centered is-vcentered block");
    			add_location(section0, file, 98, 4, 3148);
    			attr_dev(div0, "class", "container");
    			add_location(div0, file, 97, 3, 3120);
    			attr_dev(div1, "class", "hero-body");
    			add_location(div1, file, 96, 2, 3093);
    			attr_dev(section1, "class", "hero is-fullheight");
    			add_location(section1, file, 95, 1, 3054);
    			add_location(main, file, 94, 0, 3046);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section1);
    			append_dev(section1, div1);
    			append_dev(div1, div0);
    			append_dev(div0, section0);
    			append_dev(section0, p);
    			append_dev(div0, t1);
    			mount_component(searchbar, div0, null);
    			append_dev(div0, t2);
    			mount_component(features, div0, null);
    			append_dev(div0, t3);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div0, null);
    			}

    			insert_dev(target, t4, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const features_changes = {};
    			if (dirty & /*open_bookmarks*/ 16) features_changes.open_bookmarks = /*open_bookmarks*/ ctx[4];
    			if (dirty & /*is_back_hidden*/ 128) features_changes.is_back_hidden = /*is_back_hidden*/ ctx[7];
    			if (dirty & /*is_bookmarks_hidden*/ 256) features_changes.is_bookmarks_hidden = /*is_bookmarks_hidden*/ ctx[8];
    			features.$set(features_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					} else {
    						if_block0.p(ctx, dirty);
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (/*notification*/ ctx[9]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(features.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(features.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(searchbar);
    			destroy_component(features);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching) detach_dev(t4);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function getRecipe(recipe) {
    	let recipe_data;

    	try {
    		let recipe_response = await fetch(`https://forkify-api.herokuapp.com/api/get?rId=${recipe}`);
    		recipe_data = await recipe_response.json();
    	} catch(e) {
    		console.error(e);
    	}

    	return recipe_data.recipe;
    }

    async function getBookmarksRecipes(bookmarks) {
    	let bookmarks_datas = [];

    	for (const recipe of bookmarks) {
    		let bookmark_recipe = await getRecipe(recipe);
    		bookmarks_datas.push(bookmark_recipe);
    	}

    	return bookmarks_datas;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let bookmarks, bookmarks_recipes = [], recipes = [], recipe_to_open;

    	let open_bookmarks = false,
    		searching = false,
    		open_recipe = false,
    		is_back_hidden = true,
    		is_bookmarks_hidden = false,
    		notification = false;

    	bookmarks_store.subscribe(async value => {
    		$$invalidate(0, bookmarks = value);
    		$$invalidate(1, bookmarks_recipes = await getBookmarksRecipes(bookmarks));
    	});

    	recipes_store.subscribe(value => {
    		$$invalidate(2, recipes = value);
    	});

    	const addRecipeToBookmarks = event => {
    		let recipe_id = event.detail.id;
    		if (bookmarks.includes(recipe_id)) return;
    		bookmarks.push(recipe_id);
    		bookmarks_store.set(bookmarks);
    	};

    	const removeFromBookmarks = event => {
    		let recipe_id = event.detail.id;
    		let index_bookmark = bookmarks.indexOf(recipe_id);
    		bookmarks.splice(index_bookmark, 1);
    		bookmarks_store.set(bookmarks);
    	};

    	const openRecipe = async event => {
    		let recipe_id = event.detail.recipe;
    		$$invalidate(3, recipe_to_open = await getRecipe(recipe_id));
    		$$invalidate(6, open_recipe = true);
    		$$invalidate(7, is_back_hidden = false);
    		$$invalidate(8, is_bookmarks_hidden = true);
    	};

    	const closeRecipe = () => {
    		$$invalidate(3, recipe_to_open = null);
    		$$invalidate(6, open_recipe = false);
    		$$invalidate(7, is_back_hidden = true);
    		$$invalidate(8, is_bookmarks_hidden = false);
    	};

    	const handleOpenCloseBookmarks = event => {
    		if (open_recipe && !open_bookmarks) closeRecipe();
    		$$invalidate(4, open_bookmarks = event.detail.open_close);
    	};

    	const queryNotPossible = () => {
    		$$invalidate(9, notification = true);
    		setTimeout(closeNotification, 2000);
    	};

    	const closeNotification = () => {
    		$$invalidate(9, notification = false);
    	};

    	async function getRecipes(query) {
    		try {
    			let recipes_response = await fetch(`https://forkify-api.herokuapp.com/api/search?q=${query}`);

    			if (recipes_response.status == 400) {
    				queryNotPossible();
    				return;
    			}

    			let recipes_data = await recipes_response.json();
    			recipes_store.set(recipes_data.recipes);
    		} catch(e) {
    			queryNotPossible();
    		}
    	}

    	const handleSearching = async event => {
    		await getRecipes(event.detail.searched.toLowerCase());
    		$$invalidate(5, searching = event.detail.search);
    		$$invalidate(4, open_bookmarks = false);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		SearchBar,
    		RecipeList,
    		Features,
    		Recipe,
    		bookmarks_store,
    		recipes_store,
    		bookmarks,
    		bookmarks_recipes,
    		recipes,
    		recipe_to_open,
    		open_bookmarks,
    		searching,
    		open_recipe,
    		is_back_hidden,
    		is_bookmarks_hidden,
    		notification,
    		addRecipeToBookmarks,
    		removeFromBookmarks,
    		openRecipe,
    		closeRecipe,
    		handleOpenCloseBookmarks,
    		queryNotPossible,
    		closeNotification,
    		getRecipes,
    		handleSearching,
    		getRecipe,
    		getBookmarksRecipes
    	});

    	$$self.$inject_state = $$props => {
    		if ('bookmarks' in $$props) $$invalidate(0, bookmarks = $$props.bookmarks);
    		if ('bookmarks_recipes' in $$props) $$invalidate(1, bookmarks_recipes = $$props.bookmarks_recipes);
    		if ('recipes' in $$props) $$invalidate(2, recipes = $$props.recipes);
    		if ('recipe_to_open' in $$props) $$invalidate(3, recipe_to_open = $$props.recipe_to_open);
    		if ('open_bookmarks' in $$props) $$invalidate(4, open_bookmarks = $$props.open_bookmarks);
    		if ('searching' in $$props) $$invalidate(5, searching = $$props.searching);
    		if ('open_recipe' in $$props) $$invalidate(6, open_recipe = $$props.open_recipe);
    		if ('is_back_hidden' in $$props) $$invalidate(7, is_back_hidden = $$props.is_back_hidden);
    		if ('is_bookmarks_hidden' in $$props) $$invalidate(8, is_bookmarks_hidden = $$props.is_bookmarks_hidden);
    		if ('notification' in $$props) $$invalidate(9, notification = $$props.notification);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		bookmarks,
    		bookmarks_recipes,
    		recipes,
    		recipe_to_open,
    		open_bookmarks,
    		searching,
    		open_recipe,
    		is_back_hidden,
    		is_bookmarks_hidden,
    		notification,
    		addRecipeToBookmarks,
    		removeFromBookmarks,
    		openRecipe,
    		closeRecipe,
    		handleOpenCloseBookmarks,
    		closeNotification,
    		handleSearching
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
