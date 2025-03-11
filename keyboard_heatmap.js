// keyboard_heatmap.js

function createKeyboardLayout() {
    const layout = [
        ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'BackSpace'],
        ['Caps_Lock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'Enter'],
        ['Shift_L', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Shift_R'],
        ['Control_L', 'space', 'Control_R']
    ];
    return layout;
}

function createHeatmapSVG(layout, data) {
    const keyWidth = 40;
    const keyHeight = 40;
    const keySpacing = 5;

    // Calculate offsets
    const rowOffsets = [
        0,
        keyWidth * 0.5,
        keyWidth,
        keyWidth * 1.5
    ];

    const totalWidth = layout[0].length * (keyWidth + keySpacing) + keySpacing + keyWidth * 1.5;
    const totalHeight = layout.length * (keyHeight + keySpacing) + keySpacing;

    // Create a container div to center the SVG
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.width = '100%';

    const svg = d3.create("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .attr("class", "keyboard-heatmap");

    const rows = svg.selectAll(".keyboard-row")
        .data(layout)
        .join("g")
        .attr("class", "keyboard-row")
        .attr("transform", (d, i) => `translate(${rowOffsets[i]}, ${i * (keyHeight + keySpacing)})`);

    // Find min and max differences for color scale
    const differences = Object.values(data);
    const minDiff = d3.min(differences);
    const maxDiff = d3.max(differences);

    // Create a diverging color scale
    const colorScale = d3.scaleSequential(d3.interpolateRdBu)
        .domain([.2, -.2]);

    // Create an object to track cumulative x position for each row
    const positionTracker = {};

    const keys = rows.selectAll(".key")
    .data((d, rowIndex) => {
        // Initialize position tracker for this row
        positionTracker[rowIndex] = keySpacing;

        // Map each key with its position information
        return d.map((key, keyIndex) => {
            const currentPos = positionTracker[rowIndex];

            // Calculate width based on key type
            let width = keyWidth;
            if (key === 'BackSpace') width = keyWidth * 2;
            else if (key === "Tab") width = keyWidth * 1.5;
            else if (key === 'Caps_Lock') width = keyWidth * 1.75;
            else if (key === "Enter") width = keyWidth * 2;
            else if (key === "Shift_L" || key === "Shift_R") width = keyWidth * 2.25;
            else if (key === 'Control_L' || key === 'Control_R') width = keyWidth * 1.75;
            else if (key === 'space') width = keyWidth * 5.8;

            // Update position tracker for next key
            positionTracker[rowIndex] += width + keySpacing;

            // Return key with position info
            return {
                key: key,
                position: currentPos,
                width: width
            };
        });
    })
    .join("g")
        .attr("class", "key")
        .attr("transform", d => `translate(${d.position}, ${keySpacing})`)
        .attr("id", d => `key-${d.key}`);

    keys.append("rect")
        .attr("width", d => d.width)
        .attr("height", keyHeight)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", d => {
            const diff = data[d.key];
            return diff === undefined ? "#ccc" : colorScale(diff); // Handle missing keys
        })
        .attr("stroke", "#999");

    // Improved text color logic based on background color
    keys.append("text")
        .attr("x", d => d.width / 2)
        .attr("y", keyHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", d => {
            const diff = data[d.key];
            // If no data or neutral, use dark text
            if (diff === undefined) return "#333";
            
            // For extreme values that get dark backgrounds, use white text
            // For values closer to center of the scale, use dark text
            return Math.abs(diff) > 0.15 ? "#fff" : "#333";
        })
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(d => d.key);

    // Add a tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("display", "none");

    keys.on("mouseover", function(event, d) {
        const diff = data[d.key];
        if (diff !== undefined) {
          tooltip.style("display", "block")
              .html(`Difference: ${diff.toFixed(2)} ms`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 10) + "px");
        }
      })
      .on("mousemove", function(event, d){ //so it follows mouse
        tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("display", "none");
      });
      
    // Create a legend
    const legendWidth = 300;
    const legendHeight = 60;
    const legendSvg = d3.create("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("margin-top", "20px");
    
    // Create a gradient for the legend
    const defs = legendSvg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");
    
    // Add color stops to the gradient
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(-0.2));
    
    gradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", colorScale(0));
    
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(0.2));
    
    // Add the gradient rectangle
    legendSvg.append("rect")
        .attr("x", 20)
        .attr("y", 10)
        .attr("width", legendWidth - 40)
        .attr("height", 20)
        .style("fill", "url(#legend-gradient)");
    
    // Add labels
    legendSvg.append("text")
        .attr("x", 20)
        .attr("y", 50)
        .attr("text-anchor", "start")
        .text("-0.2 ms");
    
    // legendSvg.append("text")
    //     .attr("x", legendWidth / 2)
    //     .attr("y", 50)
    //     .attr("text-anchor", "middle")
    //     .text("No Difference");
    
    legendSvg.append("text")
        .attr("x", legendWidth - 20)
        .attr("y", 50)
        .attr("text-anchor", "end")
        .text("+0.2 ms");
    
    // Title for the heatmap
    const title = document.createElement('h3');
    title.textContent = "Keyboard Typing Delay: Parkinson's vs Control Group";
    title.style.textAlign = 'center';
    
    // Add everything to the container
    container.appendChild(title);
    container.appendChild(svg.node());
    container.appendChild(legendSvg.node());
    
    return container;
}

function createHeatmap() {
    d3.csv("data/keystroke_data.csv").then(data => {
        // Filter data
        const parkinsonsData = data.filter(d => d.has_parkinsons === "True");
        const controlData = data.filter(d => d.has_parkinsons === "False");

        // Calculate mean delay for each key for Parkinson's
        const parkinsonsDelays = {};
        parkinsonsData.forEach(d => {
            const key = d.key;
            const delay = +d.delay;
            if (!isNaN(delay)) {
                if (!parkinsonsDelays[key]) {
                    parkinsonsDelays[key] = { sum: 0, count: 0 };
                }
                parkinsonsDelays[key].sum += delay;
                parkinsonsDelays[key].count++;
            }
        });

        // Calculate mean delay for each key for Control
        const controlDelays = {};
        controlData.forEach(d => {
            const key = d.key;
            const delay = +d.delay;
            if (!isNaN(delay)) {
                if (!controlDelays[key]) {
                    controlDelays[key] = { sum: 0, count: 0 };
                }
                controlDelays[key].sum += delay;
                controlDelays[key].count++;
            }
        });
        // Calculate mean delay differences (Parkinson's - Control)
        const delayDifferences = {};
        for (const key in parkinsonsDelays) {
          if(controlDelays[key] !== undefined){ //make sure exists
            const parkinsonsMean = parkinsonsDelays[key].sum / parkinsonsDelays[key].count;
            const controlMean = controlDelays[key].sum / controlDelays[key].count;
            delayDifferences[key] = parkinsonsMean - controlMean;
          }
        }

        const layout = createKeyboardLayout();
        const heatmapContainer = createHeatmapSVG(layout, delayDifferences);
        
        // Use the correct container ID from your HTML
        const targetContainer = document.getElementById("keyboard-heatmap-container");
        if (targetContainer) {
            targetContainer.appendChild(heatmapContainer);
        } else {
            console.error("Container #keyboard-heatmap-container not found");
        }
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
}

document.addEventListener('DOMContentLoaded', createHeatmap);