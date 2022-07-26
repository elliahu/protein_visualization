import uPlot from './dist/uPlot.esm.js';

// default threshold value is set to 0.5
let threshold = 0.5;
let labels = [];

/// Plugin for rendering points in the chart as a star
/// Experimantal plugin to be removed on release
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

// column-highlights the hovered x index
function columnHighlightPlugin({ className, style = { backgroundColor: "rgba(253,231,76,0.2)" } } = {}) {
    let underEl, overEl, highlightEl, currIdx;

    function init(u) {
        underEl = u.under;
        overEl = u.over;

        highlightEl = document.createElement("div");

        className && highlightEl.classList.add(className);

        uPlot.assign(highlightEl.style, {
            pointerEvents: "none",
            display: "none",
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            ...style
        });

        underEl.appendChild(highlightEl);

        // show/hide highlight on enter/exit
        overEl.addEventListener("mouseenter", () => { highlightEl.style.display = null; });
        overEl.addEventListener("mouseleave", () => { highlightEl.style.display = "none"; });
    }

    function update(u) {
        if (currIdx !== u.cursor.idx) {
            currIdx = u.cursor.idx;

            let [iMin, iMax] = u.series[0].idxs;

            const dx = iMax - iMin;
            const width = (u.bbox.width / dx) / devicePixelRatio;
            const xVal = u.scales.x.distr == 2 ? currIdx : u.data[0][currIdx];
            const left = u.valToPos(xVal, "x") - width / 2;

            highlightEl.style.transform = "translateX(" + Math.round(left) + "px)";
            highlightEl.style.width = Math.round(width) + "px";
        }
    }

    return {
        opts: (u, opts) => {
            uPlot.assign(opts, {
                cursor: {
                    x: true,
                    y: true,
                }
            });
        },
        hooks: {
            init: init,
            setCursor: update,
        }
    };
}

/// renders draw time to the chart
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

/// returns array of the same length as data parameter
/// where every value over threshold in the data array is represented by 1
/// other values are 0
function prepareData(data, threshold) {
    let _data = [];
    for (let i = 0; i < data.length; i++) {
        (data[i] > threshold) ? _data.push(1) : _data.push(0);
    }
    return _data;
}

/// 
const { linear, spline, stepped, bars } = uPlot.paths;
const _bars60_100 = bars({ size: [0.6, 100] });
const _bars80_100 = bars({ size: [0.8, 100] });
const _bars90_100 = bars({ size: [0.9, 100] });
const _bars100_100 = bars({ size: [1.0, 100] });

/// adds event listener of event ev on element el which call function
/// fn when fired
function on(ev, el, fn) {
    el.addEventListener(ev, fn);
}

/// removes event listener of event ev on element el which call function
/// fn when fired
function off(ev, el, fn) {
    el.removeEventListener(ev, fn);
}

/// function creates charts
function makeChart(data, {
    enableControls = true,
    onAreaSelected = function (min, max) { },
    labelBreakPoint = 8,
    grid = {
        gridColor: '#dedede',
        width: 1,
        dash: []
    },
    ticks = {
        width: 1,
        size: 10,
        dash: []
    },
    columnHighlight = true,
    displayThresholdLineInRanger = true,
} = {}, element = document.body,) {
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


    /// calculates size of the window
    /// allows height limitation
    function getWindowSize(heighLimit = 400) {
        return {
            width: element.offsetWidth,
            //height: window.innerHeight - 200, // relative height
            height: heighLimit // absolute height
        }
    }

    // threshold controls

    let chartControls = document.createElement('div');
    chartControls.id = 'chartControls';
    element.appendChild(chartControls);

    /// function updates threshold to a new value
    /// then uses the new threshold to rerender threshold line in the uplot1 chart
    /// and bars in the uplot2 chart
    function updateThreshold(_threshold) {
        threshold = _threshold;
        uplot1.data[1][0] = threshold;
        uplot1.data[1][uplot1.data[1].length - 1] = threshold;
        uplot1.redraw();

        uplot2.setData([data[0], prepareData(data[2], threshold)]);
        uplot2.redraw();

        if(displayThresholdLineInRanger){
            uRanger.data[2][0] = threshold;
            uRanger.data[2][uplot1.data[1].length - 1] = threshold;
            uRanger.redraw();
        }
    }

    if (enableControls) {
        // range
        let thresholdRange = document.createElement('input');
        thresholdRange.type = 'range';
        thresholdRange.step = 0.01;
        thresholdRange.value = threshold;
        thresholdRange.min = 0;
        thresholdRange.max = 1;

        on('input', thresholdRange, function (e) {
            updateThreshold(e.target.value);
            thresholdInput.value = threshold;
        });


        // input
        let thresholdInput = document.createElement('input');
        thresholdInput.type = 'number';
        thresholdInput.step = 0.01;
        thresholdInput.value = threshold;

        on('input', thresholdInput, function (e) {
            updateThreshold(e.target.value);
            thresholdRange.value = threshold;
        });

        chartControls.appendChild(thresholdRange);
        chartControls.appendChild(thresholdInput);
    }


    /// RANGER
    /// ranger is used for navigation in the dataset
    /// alows selection of visible range

    let initXmin = 0; // initial value of start
    let initXmax = 35; // initial value og end

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

    /// places div as a child if par and adds cls class to it
    function placeDiv(par, cls) {
        let el = doc.createElement("div");
        el.classList.add(cls);
        par.appendChild(el);
        return el;
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
                fill: "rgba(255, 155, 84, 1)",
                fillTo: 0,
            },
            {
                label: "Threshold",
                value: (u, v) => threshold,
                stroke: "#333",
                dash: [10, 5],
                spanGaps: true,
                show: displayThresholdLineInRanger
            },
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
            {
                grid: {
                    show: true,
                    stroke: grid.gridColor,
                    width: 2,
                    dash: [],
                },
            },
            {
                values: (u, vals, space) => "",
            },
        ],
    };

    let uRanger = new uPlot(rangerOpts, [data[0], data[2],data[1]], element);

    let annotating = false;

    const cursorOpts = {
        lock: false,
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
            x: true,
            y: false
        },
    };

    /// hook function to draw threshold line directly to canvas
    function drawThresholdLine(u, si) {
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

    function getXGridSpacing(self, axisIdx, scaleMin, scaleMax) {
        let len = scaleMax - scaleMin;
        let diff = self.bbox.width / len;
        return diff;
    }

    function getXGridValues(self, vals, axisIdx, foundSpace, foundIcr) {
        if (foundSpace > labelBreakPoint)
            return vals.map(v => labels[v]);
        else
            return "";
    }

    const gridOpts = {
        show: true,
        stroke: grid.gridColor,
        width: grid.width,
        dash: grid.dash,
    };

    const tickOpts = {
        show: true,
        stroke: grid.gridColor,
        width: ticks.width,
        dash: ticks.dash,
        size: ticks.size,
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
        select: {
            over: false,
        },
        series: [
            {
                label: 'Label',
                value: (u, v) => v == null ? "-" : labels[v] + "  " + "(" + v + ")",
            },
            {
                label: "Threshold",
                value: (u, v) => threshold,
                stroke: "#333",
                dash: [10, 5],
                spanGaps: true,
            },
            {
                label: "Aggregation",
                value: (u, v) => v == null ? "-" : v + "",
                stroke: "red",
                fill: "rgba(255, 155, 84, 1)",
                paths: _bars80_100,
                points: { show: false },
            },
            {
                label: "Aggregation trend",
                value: (u, v) => v == null ? "-" : v + "",
                stroke: "red",
                fill: "rgba(255, 155, 84, 0.4)",
                fillTo: 0,
                width: 2
            },

            {
                label: "ASA",
                value: (u, v) => v == null ? "-" : v + "",
                stroke: "blue",
                dash: [10, 5],
            },
        ],
        bands: [
            {
                series: [3, 1]
            }
        ],
        axes: [
            {
                values: getXGridValues,
                space: getXGridSpacing,
                grid: gridOpts,
            },
            {
                values: (u, vals, space) => vals.map(v => +v.toFixed(1) + ""),
                grid: gridOpts,
                ticks: tickOpts,
            },
        ],
        plugins: [
            //wheelZoomPlugin({factor: .75}),
            renderStatsPlugin({ textColor: '#333' }),
            (columnHighlight) ? columnHighlightPlugin() : () => { },
        ],
        hooks: {
            drawSeries: [
                // draw hook for threshold line
                // unused -> used dataset [x, null ... null, x];
                //(u, si) => drawThresholdLine(u,si)
            ],
            setSelect: [
                (u) => {
                    let _lIdx = u.posToIdx(u.select.left);
                    let _rIdx = u.posToIdx(u.select.left + u.select.width);

                    onAreaSelected(_lIdx, _rIdx);
                    //console.log(`region selected [${_lIdx},${_rIdx}]`);
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
                fill: "rgba(255, 155, 84, 1)",
                paths: _bars80_100,
                points: {
                    show: false
                }
            },
        ],
        axes: [
            {
                values: getXGridValues,
                space: getXGridSpacing,
                grid: gridOpts,
            },
            {
                values: (u, vals, space) => "",
            },
        ],
        plugins: [
            //seriesPointsPlugin({ spikes: 6}),
            //wheelZoomPlugin({factor: .75}),
        ]
    };
    let uplot2 = new uPlot(opts2, [data[0], prepareData(data[2], threshold),], element);

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

    return parseCSV(text, separator);
}

function parseCSV(text, separator = ';') {
    // parse text line by line
    let lines = text.split('\n');
    if (lines.length > 0) {

        let _x = [];
        let _labels = [];
        let _agg = [];
        let _asa = [];
        let _threshold = [];

        // for each line, to be changed to for instead
        lines.forEach((line, index) => {
            line = line.trim();
            let cells = line.split(separator);

            _x.push(index);
            (index == 0 || index == lines.length - 1) ? _threshold.push(threshold) : _threshold.push(null);
            //_threshold.push(threshold);

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
            labels: _labels, // array of lables [K,L,M,...]
            data: [
                _x, // array of x values [1,2,3,4, ... ]
                _threshold, // threshold line [threshold, null, null, ... , null, threshold]
                _agg, // second column from csv source - will be displayed as line
                _agg, // second column from csv source - will be displayed as bars
                _asa, // third column from csv source - currently randomly generated
            ]
        }
    }
}


// exports
export { fetchDataCSV, parseCSV, makeChart };