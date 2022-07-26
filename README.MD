# JavaScript module for visualization of selected protein properties

## Installation
1. Download or clone this repository.
2. Import the source file in your code
```javascript
import {fetchDataCSV, parseCSV, makeChart} from './datachart.js';
```
3. Create a config
```javascript
let config = {
    enableControls: true, // displays controls at the top
    onAreaSelected: (min, max) => console.log(`area selected [${min}, ${max}]`), // area selected callback
    displayThresholdLineInRanger: true, // display / hide threshold line in ranger
}
```
4. Fecth the CSV data ot use raw string
```javascript
let csv = 'output_last/avg_Maternal_protein_pumilio.csv';

fetchDataCSV(csv).then((result) => {
    setTimeout(() => makeChart(result.data, config, document.body));
});
```
```javascript
let raw = `K;0.029938459 ... C;0.138413437`; // raw data as a string

setTimeout(() => makeChart(parseCSV(raw).data, config, document.body));
```

See the result [here](https://elliahu.github.io/protein_visualization/).