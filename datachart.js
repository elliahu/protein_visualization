import uPlot from './dist/uPlot.esm.js';

let threshold = 0.5;
let labels = [];

/// Plugins 
function seriesPointsPlugin({ spikes = 4, outerRadius = 8, innerRadius = 4 } = {}) {
    outerRadius *= devicePixelRatio;
    innerRadius *= devicePixelRatio;

    function drawStar(ctx, cx, cy) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }

    function drawPointsAsStars(u, i, i0, i1) {
        let { ctx } = u;
        let { _stroke, scale } = u.series[i];

        ctx.save();

        ctx.fillStyle = _stroke;

        let j = i0;

        while (j <= i1) {
            let val = u.data[i][j];
            let cx = Math.round(u.valToPos(u.data[0][j], 'x', true));
            let cy = Math.round(u.valToPos(val, scale, true));
            drawStar(ctx, cx, cy);
            ctx.fill();
            j++;
        };

        ctx.restore();
    }

    return {
        opts: (u, opts) => {
            opts.series.forEach((s, i) => {
                if (i > 0) {
                    uPlot.assign(s, {
                        points: {
                            show: drawPointsAsStars,
                        }
                    });
                }
            });
        }
    };
}

/// renders draw time to the cart
function renderStatsPlugin({ textColor = 'red', font } = {}) {
    font = font ?? `${Math.round(12 * devicePixelRatio)}px Arial`;

    let startRenderTime;

    function setStartTime() {
        startRenderTime = Date.now();
    }

    function drawStats(u) {
        let { ctx } = u;
        let { left, top, width, height } = u.bbox;
        let displayText = "Time to Draw: " + (Date.now() - startRenderTime) + "ms";

        ctx.save();

        ctx.font = font;
        ctx.fillStyle = textColor;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(displayText, left + 10, top + 10);

        ctx.restore();
    }

    return {
        hooks: {
            drawClear: setStartTime,
            draw: drawStats,
        }
    };
}


function prepareData(data, threshold) {
    let _data = [];
    for (let i = 0; i < data.length; i++) {
        (data[i] > threshold) ? _data.push(1) : _data.push(0);
    }
    return _data;
}

function getWindowSize(heighLimit = 400) {
    return {
        width: window.innerWidth - 100,
        //height: window.innerHeight - 200, // relative
        height: heighLimit // absolute height
    }
}

const { linear, spline, stepped, bars } = uPlot.paths;
const _bars60_100 = bars({ size: [0.6, 100] });
const _bars80_100 = bars({ size: [0.8, 100] });
const _bars90_100 = bars({ size: [0.9, 100] });
const _bars100_100 = bars({ size: [1.0, 100] });


function makeChart(data, element = document.body, { enableControls = true } = {}) {
    // Sync
    let mooSync = uPlot.sync("moo");

    let synced = true;

    let syncedUpDown = true;

    function upDownFilter(type) {
        return syncedUpDown || (type != "mouseup" && type != "mousedown");
    }

    const matchSyncKeys = (own, ext) => own == ext;

    let uplot2HeightLimit = 100;
    let rangerHeightLimit = 100;

    // threshold controls

    let chartControls = document.createElement('div');
    chartControls.id = 'chartControls';
    element.appendChild(chartControls);

    if (enableControls) {
        // range
        let thresholdRange = document.createElement('input');
        thresholdRange.type = 'range';
        thresholdRange.step = 0.01;
        thresholdRange.value = threshold;
        thresholdRange.min = 0;
        thresholdRange.max = 1;

        thresholdRange.addEventListener('input', function (e) {
            threshold = e.target.value;
            thresholdInput.value = threshold;
            uplot1.redraw();
        });

        // input
        let thresholdInput = document.createElement('input');
        thresholdInput.type = 'number';
        thresholdInput.step = 0.01;
        thresholdInput.value = threshold;

        thresholdInput.addEventListener('input', function (e) {
            threshold = e.target.value;
            thresholdRange.value = threshold;
            uplot1.redraw();
        });

        chartControls.appendChild(thresholdRange);
        chartControls.appendChild(thresholdInput);
    }


    /// RANGER

    let initXmin = 0;
    let initXmax = 35;

    let doc = document;

    function debounce(fn) {
        let raf;

        return (...args) => {
            if (raf)
                return;

            raf = requestAnimationFrame(() => {
                fn(...args);
                raf = null;
            });
        };
    }

    function placeDiv(par, cls) {
        let el = doc.createElement("div");
        el.classList.add(cls);
        par.appendChild(el);
        return el;
    }

    function on(ev, el, fn) {
        el.addEventListener(ev, fn);
    }

    function off(ev, el, fn) {
        el.removeEventListener(ev, fn);
    }

    let x0;
    let lft0;
    let wid0;

    const lftWid = { left: null, width: null };
    const minMax = { min: null, max: null };

    function update(newLft, newWid) {
        let newRgt = newLft + newWid;
        let maxRgt = uRanger.bbox.width / devicePixelRatio;

        if (newLft >= 0 && newRgt <= maxRgt) {
            select(newLft, newWid);
            zoom(newLft, newWid);
        }
    }

    function select(newLft, newWid) {
        lftWid.left = newLft;
        lftWid.width = newWid;
        uRanger.setSelect(lftWid, false);
    }

    function zoom(newLft, newWid) {
        minMax.min = uRanger.posToVal(newLft, 'x');
        minMax.max = uRanger.posToVal(newLft + newWid, 'x');
        uplot1.setScale('x', minMax);
        uplot2.setScale('x', minMax);
    }

    function bindMove(e, onMove) {
        x0 = e.clientX;
        lft0 = uRanger.select.left;
        wid0 = uRanger.select.width;

        const _onMove = debounce(onMove);
        on("mousemove", doc, _onMove);

        const _onUp = e => {
            off("mouseup", doc, _onUp);
            off("mousemove", doc, _onMove);
            //viaGrip = false;
        };
        on("mouseup", doc, _onUp);

        e.stopPropagation();
    }

    const rangerOpts = {
        title: "Ranger",
        ...getWindowSize(rangerHeightLimit),
        cursor: {
            x: false,
            y: false,
            points: {
                show: false,
            },
            drag: {
                setScale: false,
                setSelect: true,
                x: true,
                y: false,
            },
        },
        legend: {
            show: false
        },
        scales: {
            x: {
                time: false,
            },
        },
        series: [
            {},
            {
                stroke: "red",
                fill: "rgba(255, 0, 0, 0.3)",
                paths: _bars100_100,
                points: { show: false },
            }
        ],
        hooks: {
            ready: [
                uRanger => {
                    let left = Math.round(uRanger.valToPos(initXmin, 'x'));
                    let width = Math.round(uRanger.valToPos(initXmax, 'x')) - left;
                    let height = uRanger.bbox.height / devicePixelRatio;
                    uRanger.setSelect({ left, width, height }, false);

                    const sel = uRanger.root.querySelector(".u-select");

                    on("mousedown", sel, e => {
                        bindMove(e, e => update(lft0 + (e.clientX - x0), wid0));
                    });

                    on("mousedown", placeDiv(sel, "u-grip-l"), e => {
                        bindMove(e, e => update(lft0 + (e.clientX - x0), wid0 - (e.clientX - x0)));
                    });

                    on("mousedown", placeDiv(sel, "u-grip-r"), e => {
                        bindMove(e, e => update(lft0, wid0 + (e.clientX - x0)));
                    });
                }
            ],
            setSelect: [
                uRanger => {
                    zoom(uRanger.select.left, uRanger.select.width);
                }
            ],
        },
        axes: [
            {},
            {
                values: (u, vals, space) => "",
            },
        ],
    };

    let uRanger = new uPlot(rangerOpts, data, element);

    let annotating = false;

    const cursorOpts = {
        lock: true,
        sync: {
            key: mooSync.key,
            setSeries: true,
            match: [matchSyncKeys, matchSyncKeys],
            filters: {
                pub: upDownFilter,
            }
        },
        drag: {
            setScale: false,
            x:true,
            y:false
        },
        bind: {
            mousedown: (u, targ, handler) => {
                return e => {
                    if (e.button == 0) {
                        handler(e);

                        if(e.ctrlKey){
                            annotating = true;
                            // switch select region to annotation color
                            u.root.querySelector(".u-select").classList.add("u-annotate");
                        }
                        

                    }
                }
            },
            mouseup: (u, targ, handler) => {
                return e => {
                    if (e.button == 0) {
                        if (annotating) {
                            // fire original handler
                            handler(e);
                        }
                        else
                            handler(e);
                    }
                };
            }
        },
    };

    const opts = {
        title: "Aggregation profile",
        ...getWindowSize(),
        focus: {
            alpha: 0.3,
        },
        scales: {
            x: {
                time: false,
                min: initXmin,
                max: initXmax,
            },
            y: {
                range: [0, 1],
            }
        },
        cursor: cursorOpts,
        select:{
            over:false
        },
        series: [
            {
                label: 'Label',
                value: (u, v) => v == null ? "-" : labels[v] + "  " + "(" + v + ")",
            },
            {
                label: "Aggregation",
                value: (u, v) => v == null ? "-" : v + "",
                stroke: "red",
                fill: "rgba(255, 0, 0, 0.3)",
                paths: _bars80_100,
                points: { show: false },
            },
            {
                label: "Aggregation trend",
                value: (u, v) => v == null ? "-" : v + "",
                stroke: "red",
            },
            {
                label: "ASA",
                value: (u, v) => v == null ? "-" : v + "",
                stroke: "blue",
                dash: [10, 5]
            }
        ],
        axes: [
            {},
            {
                values: (u, vals, space) => vals.map(v => +v.toFixed(1) + ""),
            },
        ],
        plugins: [
            //wheelZoomPlugin({factor: .75}),
            renderStatsPlugin({ textColor: '#333' }),
        ],
        hooks: {
            drawSeries: [
                // draw hook for threshold line
                (u, si) => {
                    if (si != 1) {
                        return;
                    }
                    let ctx = u.ctx;

                    ctx.save();

                    let s = u.series[si];
                    let xd = u.data[0];
                    let yd = u.data[si];

                    let [i0, i1] = s.idxs;

                    let x0 = u.valToPos(xd[i0], 'x', true);
                    let y0 = u.valToPos(threshold, 'y', true);
                    let x1 = u.valToPos(xd[i1], 'x', true);
                    let y1 = u.valToPos(threshold, 'y', true);

                    const offset = (s.width % 2) / 2;

                    ctx.translate(offset, offset);
                    ctx.beginPath();
                    ctx.strokeStyle = '#333';
                    ctx.setLineDash([5, 5]);
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                    ctx.stroke();

                    ctx.translate(-offset, -offset);

                    ctx.restore();
                }
            ],
            setSelect: [
                (u) => {
                    let _lIdx = u.posToIdx(u.select.left);
                    let _rIdx = u.posToIdx(u.select.left + u.select.width);

                    console.log('region was selected');
                    console.log("["+ _lIdx +', ' + _rIdx +"]");
                    annotating = false;
                }
            ]
        },
    };

    let uplot1 = new uPlot(opts, data, element);

    const opts2 = {
        title: "Sequence",
        ...getWindowSize(uplot2HeightLimit),
        cursor: cursorOpts,
        select: {
            over: false,
        },
        legend: {
            show: false
        },
        scales: {
            x: {
                time: false,
                min: initXmin,
                max: initXmax,
            }
        },
        series: [
            {},
            {
                label: "APRs",
                value: (u, v) => v == null ? "-" : v + "",
                fill: "rgba(255, 0, 0, 0.3)",
                paths: _bars100_100,
                points: {
                    show: false
                }
            },
        ],
        axes: [
            {},
            {
                values: (u, vals, space) => "",
            },
        ],
        plugins: [
            //seriesPointsPlugin({ spikes: 6}),
            //wheelZoomPlugin({factor: .75}),
        ]
    };

    let uplot2 = new uPlot(opts2, [data[0], prepareData(data[1], threshold),], element);

    window.addEventListener("resize", e => {
        uplot1.setSize(getWindowSize());
        uplot2.setSize(getWindowSize(uplot2HeightLimit));
        uRanger.setSize(getWindowSize(uplot2HeightLimit));
    });
}

async function fetchDataCSV(path, separator = ';') {
    // load data
    let data = await fetch(path);
    if (!data.ok) {
        throw `Could not fetch ${path} file!`;
    }
    let text = await data.text();

    // parse text line by line
    let lines = text.split('\n');
    if (lines.length > 0) {

        let _x = [];
        let _labels = [];
        let _agg = [];
        let _asa = [];

        // for each line, to be changed to for instead
        lines.forEach((line, index) => {
            line = line.trim();
            let cells = line.split(separator);

            _x.push(index);

            for (let j = 0; j < cells.length; j++) {
                let cell = cells[j];

                if (j == 0) {
                    // first column is label
                    if (cell.length > 0) {
                        _labels.push(cell);
                        labels.push(cell)
                    } else _agg.push(null);
                }
                else if (j == 1) {
                    // second column is aggregation vlue
                    (cell.length > 0) ? _agg.push(parseFloat(cell)) : _agg.push(null);
                }

                // for now, as there is no third column currenty
                _asa.push(Math.random());

            }
        });
        return {
            labels: _labels,
            data: [
                _x,
                _agg, // line
                _agg, // bar
                _asa
            ]
        }

    }
    else {
        throw `File ${path} is empty`;
    }
}


// export

export { fetchDataCSV, makeChart };

