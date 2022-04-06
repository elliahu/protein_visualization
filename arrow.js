const ctx = document.getElementById('chart');

const blue_color =  'rgba(3, 177, 252, 1)';

function drawArrow(width, height, posX, posY){
    const r = 2;
    var arrow = {
        arrow_body: {
            type: 'box',
            xMin: posX,
            xMax: posX + width - height/2 +1,
            yMin: posY - (height/2),
            yMax: posY + height - (height/2),
            backgroundColor: blue_color,
            borderWidth: 0,
            label:{
                content: 'Aloha',
                enabled: true
            }
        },
        arrow_head:{
            type: 'polygon',
            xMin: posX + width - (height/2),
            xMax: posX + width,
            yMin: posY - (height),
            yMax: posY + (height),
            sides: 3,
            radius: 0,
            rotation: 90,
            backgroundColor: blue_color,
            borderWidth: 0,
        }
    }

    return arrow;
}

const data = {
    datasets: [{
      label: 'Scatter Dataset',
      data: [/* {
        x: -10,
        y: -10
      }, {
        x: -10,
        y: 10
      }, {
        x: 10,
        y: -10
      }, {
        x: 10,
        y: 10
      } */],
      backgroundColor: blue_color
    }],
};

const anotations = {
    annotations: {
        arrow_body : drawArrow(5,4,0,0).arrow_body,
        arrow_head : drawArrow(5,4,0,0).arrow_head,
        box1: {
            type: 'box',
            xMin: 10,
            xMax: 15,
            yMin: -2,
            yMax: 2,
            backgroundColor: blue_color,
            borderWidth:0
        },
        arrow_body2 : drawArrow(5,4,20,0).arrow_body,
        arrow_head2 : drawArrow(5,4,20,0).arrow_head,
        line1: {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: blue_color,
            borderWidth: 2,
          }
    }
};

const config = {
    type: 'scatter',
    data: data,
    options: {
        responsive: true,
        plugins: {
            autocolors: false,
            annotation: anotations
        },
        scales: {
            y: {
                min: -50,
                max: 50,
            },
            x: {
                min: -15,
                max: 50,
            }
        }
    },
};
const myChart = new Chart(ctx, config);
