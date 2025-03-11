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

function createHeatmapSVG(layout, data, titleText, domain, parkinsonsData, controlData, selectedStatistic) {
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
        .domain([domain[1], domain[0]]); // Swap the domain to go from blue to red

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
                else if (key === 'space') width = keyWidth * 7;

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
        .attr("stroke", "#000")
        .on("mouseover", function () {
            d3.select(this)
                .attr("stroke-width", 3)
                .attr("stroke", "#333");
        })
        .on("mouseout", function () {
            d3.select(this)
                .attr("stroke-width", 1)
                .attr("stroke", "#000");
        });

    // Set all text to white with a black border
    keys.append("text")
        .attr("x", d => d.width / 2)
        .attr("y", keyHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("paint-order", "stroke")
        .attr("stroke-linejoin", "round")
        .text(d => d.key);

    // Add a tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("display", "none");

    keys.on("mouseover", function (event, d) {
        const diff = data[d.key];
        let parkinsonsValue, controlValue;
        if (d.key === "Control_R" || d.key === "Enter") {
            parkinsonsValue = NaN;
            controlValue = NaN;
        } else {
            parkinsonsValue = calculateStatistic(parkinsonsData.filter(p => p.key === d.key).map(p => +p.delay * 1000), selectedStatistic);
            controlValue = calculateStatistic(controlData.filter(c => c.key === d.key).map(c => +c.delay * 1000), selectedStatistic);
        }
        if (diff !== undefined) {
            tooltip.style("display", "block")
                .html(`
                    <div><strong>Key:</strong> <strong>${d.key}</strong></div>
                    <div><strong>Parkinson's ${selectedStatistic}:</strong> ${isNaN(parkinsonsValue) ? 'NaN' : parkinsonsValue.toFixed(2)} ms</div>
                    <div><strong>Control ${selectedStatistic}:</strong> ${isNaN(controlValue) ? 'NaN' : controlValue.toFixed(2)} ms</div>
                    <div><strong>Difference:</strong> <strong>${diff.toFixed(2)} ms</strong></div>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        } else {
            tooltip.style("display", "block")
                .html(`
                    <div><strong>Key:</strong> <strong>${d.key}</strong></div>
                    <div><strong>Parkinson's ${selectedStatistic}:</strong> NaN ms</div>
                    <div><strong>Control ${selectedStatistic}:</strong> NaN ms</div>
                    <div><strong>Difference:</strong> <strong>NaN ms</strong></div>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        }
    })
        .on("mousemove", function (event, d) { //so it follows mouse
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
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
        .attr("stop-color", colorScale(domain[0]));

    gradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", colorScale(0));

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(domain[1]));

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
        .text(`${domain[0]} ms`);

    legendSvg.append("text")
        .attr("x", legendWidth - 20)
        .attr("y", 50)
        .attr("text-anchor", "end")
        .text(`+${domain[1]} ms`);

    // Title for the heatmap
    const title = document.createElement('h3');
    title.textContent = titleText;
    title.style.textAlign = 'center';

    // Add everything to the container
    container.appendChild(title);
    container.appendChild(svg.node());
    container.appendChild(legendSvg.node());

    return container;
}

function calculateStatistic(data, statistic) {
    if (statistic === "mean") {
        return d3.mean(data);
    } else if (statistic === "median") {
        return d3.median(data);
    }
    return null;
}

function createHeatmap() {
    const statisticSelect = document.getElementById("statistic-select");
    const selectedStatistic = statisticSelect.value;

    d3.csv("data/keystroke_data.csv").then(data => {
        // Filter data
        const parkinsonsData = data.filter(d => d.has_parkinsons === "True");
        const controlData = data.filter(d => d.has_parkinsons === "False");

        // Calculate delay and duration differences
        const delayDifferences = {};
        const durationDifferences = {};

        const keys = [...new Set(data.map(d => d.key))];

        keys.forEach(key => {
            const parkinsonsDelays = parkinsonsData.filter(d => d.key === key).map(d => +d.delay * 1000); // Convert to ms
            const controlDelays = controlData.filter(d => d.key === key).map(d => +d.delay * 1000); // Convert to ms
            const parkinsonsDurations = parkinsonsData.filter(d => d.key === key).map(d => +d.duration * 1000); // Convert to ms
            const controlDurations = controlData.filter(d => d.key === key).map(d => +d.duration * 1000); // Convert to ms

            const parkinsonsDelayStat = calculateStatistic(parkinsonsDelays, selectedStatistic);
            const controlDelayStat = calculateStatistic(controlDelays, selectedStatistic);
            const parkinsonsDurationStat = calculateStatistic(parkinsonsDurations, selectedStatistic);
            const controlDurationStat = calculateStatistic(controlDurations, selectedStatistic);

            if (parkinsonsDelayStat !== null && controlDelayStat !== null) {
                delayDifferences[key] = parkinsonsDelayStat - controlDelayStat;
            }

            if (parkinsonsDurationStat !== null && controlDurationStat !== null) {
                durationDifferences[key] = parkinsonsDurationStat - controlDurationStat;
            }
        });

        const layout = createKeyboardLayout();
        const delayHeatmapContainer = createHeatmapSVG(layout, delayDifferences, `${selectedStatistic.charAt(0).toUpperCase() + selectedStatistic.slice(1)} Difference in Delay`, [-200, 200], parkinsonsData, controlData, selectedStatistic);
        const durationHeatmapContainer = createHeatmapSVG(layout, durationDifferences, `${selectedStatistic.charAt(0).toUpperCase() + selectedStatistic.slice(1)} Difference in Duration`, [-30, 30], parkinsonsData, controlData, selectedStatistic);

        // Use the correct container IDs from your HTML
        const delayTargetContainer = document.getElementById("delay-heatmap");
        const durationTargetContainer = document.getElementById("duration-heatmap");

        if (delayTargetContainer) {
            delayTargetContainer.innerHTML = ""; // Clear previous content
            delayTargetContainer.appendChild(delayHeatmapContainer);
        } else {
            console.error("Container #delay-heatmap not found");
        }

        if (durationTargetContainer) {
            durationTargetContainer.innerHTML = ""; // Clear previous content
            durationTargetContainer.appendChild(durationHeatmapContainer);
        } else {
            console.error("Container #duration-heatmap not found");
        }
    }).catch(error => {
        console.error("Error loading or processing data:", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    createHeatmap();
    document.getElementById("statistic-select").addEventListener("change", createHeatmap);
});