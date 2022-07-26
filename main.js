import {fetchDataCSV,parseCSV, makeChart} from './datachart.js';

// name of the csv file that will be fetched
let csv = 'output_last/avg_Maternal_protein_pumilio.csv';

// create an optional config to configure chart
let config = {
    enableControls: true, // displays controls at the top
    onAreaSelected: (min, max) => console.log(`area selected [${min}, ${max}]`), // area selected callback
    displayThresholdLineInRanger: true, // display / hide threshold line in ranger
}

// fetch the file then use the data from the result
fetchDataCSV(csv).then((result) => {
    setTimeout(() => makeChart(result.data, config, document.body));
});

/*
let raw = `K;0.029938459
N;0.079515249
T;0.095927288
M;0.107624605
E;0.11327486
H;0.121493628
V;0.055264294
S;0.042045668
S;0.046866963
S;0.079777904
E;0.105996847
E;0.140707523
S;0.374462277
I;0.33079122
I;0.27742372
S;0.220468648
Q;0.182356906
E;0.155232757
T;0.018253654
Y;0.015480816
K;0.015482316
Q;0.018576071
E;0.027115786
K;0.041280518
N;0.200491011
M;0.174784034
A;0.148319006
I;0.121135585
N;0.100244421
P;0.087239201
S;0.044059485
K;0.044432998
E;0.071151634
N;0.145823702
L;0.210037148
C;0.217930873
S;0.091685653
T;0.110996991
F;0.153555175
C;0.138413437
K;0.12006585
E;0.116547386
V;0.120272011
V;0.075994775
R;0.055033276
N;0.047060303
A;0.044000882
N;0.041067556
E;0.058210939
E;0.0791848`;

setTimeout(() => makeChart(parseCSV(raw).data, config, document.body));

*/
