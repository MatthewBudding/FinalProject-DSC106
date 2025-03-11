// Function to create the keyboard layout (QWERTY, simplified)
function createKeyboardLayout() {
    const layout = [
        ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'BackSpace'],
        ['Caps_Lock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'Enter'],
        ['Shift_L', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Shift_R'],
        ['Control_L', 'space', 'Control_R']
    ];
    return layout;
}

// Function to create the keyboard SVG elements with customizable size and colors
function createKeyboardSVG(layout, id, pressColor) {
    const keyWidth = 20; // Smaller keyboard
    const keyHeight = 20;
    const keySpacing = 3;

    // Calculate offsets for better alignment
    const rowOffsets = [
        0,                  // Row 1 (QWERTY)
        keyWidth * 0.5,     // Row 2 (ASDF)
        keyWidth,           // Row 3 (ZXCV)
        keyWidth * 1.5      // Row 4 (Ctrl, Space, Ctrl)
    ];

    // Calculate total width and height
    const totalWidth = layout[0].length * (keyWidth + keySpacing) + keySpacing + keyWidth * 1.5;
    const totalHeight = layout.length * (keyHeight + keySpacing) + keySpacing;

    const svg = d3.create("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .attr("class", `keyboard-svg-${id}`);

    const rows = svg.selectAll(".keyboard-row")
        .data(layout)
        .join("g")
        .attr("class", "keyboard-row")
        .attr("transform", (d, i) => `translate(${rowOffsets[i]}, ${i * (keyHeight + keySpacing)})`);

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
        .attr("id", d => `key-${id}-${d.key}`);  // Include the ID prefix

    keys.append("rect")
        .attr("width", d => d.width)
        .attr("height", keyHeight)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", "white")
        .attr("stroke", "#ccc");

    keys.append("text")
        .attr("x", d => d.width / 2)
        .attr("y", keyHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .attr("font-size", "10px") // Smaller font
        .text(d => d.key);

    return { svg: svg.node(), width: totalWidth, height: totalHeight };
}

// Create sample data for demonstration
function createSampleData(patientType) {
    // Create base sample data - will be used if real data doesn't load
    const baseTimestamp = Date.now() / 1000;
    const sampleSize = 20;

    // Create different patterns for Parkinsons vs Control
    const data = [];

    for (let i = 0; i < sampleSize; i++) {
        // For Parkinsons: more variable delays and durations
        if (patientType === "parkinsons") {
            data.push({
                key: "sample",
                press_0: (baseTimestamp + i * (0.8 + Math.random() * 0.8)).toString(),
                release_0: (baseTimestamp + i * (0.8 + Math.random() * 0.8) + 0.2 + Math.random() * 0.3).toString(),
                pID: "1001"
            });
        }
        // For Control: more consistent delays and durations
        else {
            data.push({
                key: "sample",
                press_0: (baseTimestamp + i * (0.5 + Math.random() * 0.2)).toString(),
                release_0: (baseTimestamp + i * (0.5 + Math.random() * 0.2) + 0.1 + Math.random() * 0.1).toString(),
                pID: "1002"
            });
        }
    }

    return data;
}

// Function to create metric charts
function createMetricCharts(containerId, width, height) {
    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = (height - margin.top - margin.bottom - 10) / 2; // Half height for each chart

    // Create SVG container
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create titles
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text("Typing Metrics Comparison");

    // Add clipPath definitions to the SVG
    const defs = svg.append("defs");

    // Define clipPath for delay chart
    defs.append("clipPath")
        .attr("id", "delay-clip")
        .append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    // Define clipPath for duration chart
    defs.append("clipPath")
        .attr("id", "duration-clip")
        .append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    // Top chart - Delay
    const delayChart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    delayChart.append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("fill", "#f9f9f9")
        .attr("stroke", "#ddd");

    delayChart.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Key Press Delay");

    // Create static axes for delay chart (0-2500ms)
    const staticYScaleDelay = d3.scaleLinear()
        .domain([0, 2500]) // Static range from 0 to 2000ms
        .range([chartHeight, 0]);

    delayChart.append("g")
        .attr("class", "y-axis-delay")
        .call(d3.axisLeft(staticYScaleDelay).ticks(5).tickFormat(d => `${Math.round(d)}ms`));

    // Create a group for the delay chart content that will be clipped
    const delayContentGroup = delayChart.append("g")
        .attr("clip-path", "url(#delay-clip)");

    // Bottom chart - Duration
    const durationChart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top + chartHeight + 20})`);

    durationChart.append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("fill", "#f9f9f9")
        .attr("stroke", "#ddd");

    durationChart.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Key Press Duration");

    // Create static axes for duration chart (0-500ms)
    const staticYScaleDuration = d3.scaleLinear()
        .domain([0, 500]) // Static range from 0 to 500ms
        .range([chartHeight, 0]);

    durationChart.append("g")
        .attr("class", "y-axis-duration")
        .call(d3.axisLeft(staticYScaleDuration).ticks(5).tickFormat(d => `${Math.round(d)}ms`));

    // Create a group for the duration chart content that will be clipped
    const durationContentGroup = durationChart.append("g")
        .attr("clip-path", "url(#duration-clip)");

    // Create legend
    const legend = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${height - 10})`);

    // Parkinsons legend item
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", '#6c63ff');

    legend.append("text")
        .attr("x", 15)
        .attr("y", 8)
        .attr("font-size", "10px")
        .text("Parkinsons");

    // Control legend item
    legend.append("rect")
        .attr("x", 90)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", '#ffb663');

    legend.append("text")
        .attr("x", 105)
        .attr("y", 8)
        .attr("font-size", "10px")
        .text("Control");

    return {
        delayGroup: delayContentGroup, // Use the clipped group instead of delayChart
        durationGroup: durationContentGroup, // Use the clipped group instead of durationChart
        chartWidth,
        chartHeight
    };
}

// Function to update metric charts
function updateMetricCharts(charts, parkinsonData, controlData) {
    const windowSize = 10; // Show last 10 data points

    // Limit data to window size
    const parkinsonsWindow = parkinsonData.slice(-windowSize);
    const controlWindow = controlData.slice(-windowSize);

    // Check if we have data to show
    if (parkinsonsWindow.length === 0 && controlWindow.length === 0) {
        return; // No data to show yet
    }

    // Create static scales with fixed ranges
    const xScaleDelay = d3.scaleLinear()
        .domain([0, windowSize - 1])
        .range([0, charts.chartWidth]);

    // Static Y scale for delay (0-2500ms)
    const yScaleDelay = d3.scaleLinear()
        .domain([0, 2500])
        .range([charts.chartHeight, 0]);

    const xScaleDuration = d3.scaleLinear()
        .domain([0, windowSize - 1])
        .range([0, charts.chartWidth]);

    // Static Y scale for duration (0-500ms)
    const yScaleDuration = d3.scaleLinear()
        .domain([0, 500])
        .range([charts.chartHeight, 0]);

    // Create line generators
    const delayLine = d3.line()
        .x((d, i) => xScaleDelay(i))
        .y(d => yScaleDelay(d.delay))
        .defined(d => !isNaN(d.delay)); // Skip undefined or NaN values

    const durationLine = d3.line()
        .x((d, i) => xScaleDuration(i))
        .y(d => yScaleDuration(d.duration))
        .defined(d => !isNaN(d.duration)); // Skip undefined or NaN values

    // Function to add or update a line
    function updateLine(container, className, data, lineGenerator, color) {
        const line = container.selectAll(`.${className}`)
            .data([data]);

        // Enter + update
        line.enter()
            .append("path")
            .attr("class", className)
            .merge(line)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .transition()
            .duration(25)  // Transition is already set to 25ms
            .attr("d", lineGenerator);

        // Add circles for data points
        const circles = container.selectAll(`.${className}-points`)
            .data(data);

        circles.enter()
            .append("circle")
            .attr("class", `${className}-points`)
            .attr("r", 3)
            .attr("fill", color)
            .merge(circles)
            .attr("cx", (d, i) => xScaleDelay(i))
            .attr("cy", d => {
                if (className.includes("delay")) {
                    return yScaleDelay(d.delay);
                } else {
                    return yScaleDuration(d.duration);
                }
            })
            .style("opacity", d => {
                if ((className.includes("delay") && isNaN(d.delay)) ||
                    (className.includes("duration") && isNaN(d.duration))) {
                    return 0;
                }
                return 1;
            });

        circles.exit().remove();
    }

    // Update all lines
    updateLine(charts.delayGroup, "parkinsons-delay-line", parkinsonsWindow, delayLine, '#6c63ff');
    updateLine(charts.delayGroup, "control-delay-line", controlWindow, delayLine, '#ffb663');
    updateLine(charts.durationGroup, "parkinsons-duration-line", parkinsonsWindow, durationLine, '#6c63ff');
    updateLine(charts.durationGroup, "control-duration-line", controlWindow, durationLine, '#ffb663');
}

// Function to simulate key presses based on the data
function simulateKeyPresses(data, svg, id, pressColor, metricData, startTime) {
    // Filter for relevant keys
    const validKeys = new Set([
        ...'abcdefghijklmnopqrstuvwxyz '.split(''), 'Shift_L', 'Shift_R', 'Caps_Lock', 'Enter', 'Tab', 'Control_L', 'Control_R', 'BackSpace'
    ]);

    const filteredData = data.filter(entry => validKeys.has(entry.key));

    // Calculate a reference start time for simulation
    const dataStartTime = parseFloat(filteredData[0]?.press_0 || 0);
    const simulationStartTime = startTime / 1000; // Convert to seconds
    const timeOffset = simulationStartTime - dataStartTime;

    // For each key press
    filteredData.forEach((entry, index) => {
        // Calculate adjusted times with offset
        const pressTime = (parseFloat(entry.press_0) + timeOffset) * 1000;
        const releaseTime = (parseFloat(entry.release_0) + timeOffset) * 1000;
        const now = Date.now();

        // Calculate delay before press (time since last key)
        const delay = index > 0 ?
            (parseFloat(entry.press_0) - parseFloat(filteredData[index - 1].press_0)) * 1000 : 0;

        // Calculate key press duration
        const duration = (parseFloat(entry.release_0) - parseFloat(entry.press_0)) * 1000;

        // Add metrics to tracking array when the key is pressed
        const metricUpdateTimeout = setTimeout(() => {
            metricData.push({
                timestamp: Date.now(),
                key: entry.key,
                delay: delay,
                duration: duration
            });
            // console.log(`Added metric for ${id} - key: ${entry.key}, delay: ${delay.toFixed(0)}ms, duration: ${duration.toFixed(0)}ms`);
        }, pressTime - now);

        // Timeouts for press
        const pressTimeout = setTimeout(() => {
            const keyElement = svg.querySelector(`#key-${id}-${entry.key}`);

            if (keyElement) {
                d3.select(keyElement).select("rect").attr("fill", pressColor);
            }
        }, pressTime - now);

        // Timeouts for release
        const releaseTimeout = setTimeout(() => {
            const keyElement = svg.querySelector(`#key-${id}-${entry.key}`);
            if (keyElement) {
                d3.select(keyElement).select("rect").attr("fill", "white");
            }
        }, releaseTime - now);
    });
}

// Main function to create and animate the keyboard
function createComparativeVisualization() {
    // Create container for the entire visualization
    const container = d3.select("#keyboard-comparison-section")
      .append("div")
      .attr("class", "visualization-container")
      .style("display", "flex")
      .style("width", "100%")
      .style("max-width", "1200px")
      .style("margin", "0 auto")
      .style("padding", "20px");


    // Create left container for Parkinsons keyboard
    const leftContainer = container.append("div")
        .attr("class", "keyboard-container")  // Use class for styling
        .attr("id", "parkinsons-container")
        .style("margin-right", "10px");       // Space between elements

    leftContainer.append("h3")
        .text("Parkinsons Patient (pID=1001)")
        .style("text-align", "center")
        .style("margin-bottom", "10px")
        .style("font-size", "14px")
        .style("color", "#6c63ff");

    // Create middle container for charts
    const middleContainer = container.append("div")
        .attr("class", "charts-container")
        .attr("id", "metrics-container")
        ;


    // Create right container for Control keyboard
    const rightContainer = container.append("div")
        .attr("class", "keyboard-container")   // Use class for styling
        .attr("id", "control-container")
        .style("margin-left", "10px");

    rightContainer.append("h3")
        .text("Control Subject (pID=1002)")
        .style("text-align", "center")
        .style("margin-bottom", "10px")
        .style("font-size", "14px")
        .style("color", "#ffb663");

    // Create keyboard layouts
    const layout = createKeyboardLayout();

    // Create SVG keyboards
    const parkinsonsKeyboard = createKeyboardSVG(layout, "parkinsons", '#6c63ff');
    const controlKeyboard = createKeyboardSVG(layout, "control", '#ffb663');

    // Append keyboards to containers
    document.getElementById("parkinsons-container").appendChild(parkinsonsKeyboard.svg);
    document.getElementById("control-container").appendChild(controlKeyboard.svg);

    // Create metrics charts
    const charts = createMetricCharts("metrics-container", 475, 300);

    // Arrays to track metrics
    const parkinsonsMetrics = [];
    const controlMetrics = [];

    // Function to update charts periodically
    function updateCharts() {
        updateMetricCharts(charts, parkinsonsMetrics, controlMetrics);
        requestAnimationFrame(updateCharts); // Use requestAnimationFrame for smoother updates
    }

    // Start updating charts
    updateCharts();

    // Record start time for synchronized simulation
    const startTime = Date.now();

    // First try to load real data
    Promise.all([
        d3.csv("data/keystroke_data.csv").catch(() => null),
        d3.csv("data/keystroke_data.csv").catch(() => null)
    ]).then(([data1, data2]) => {
        // If real data couldn't be loaded, use sample data
        if (!data1 || !data2) {
            console.log("Real data couldn't be loaded, using sample data instead");

            // Create sample data for demonstration
            const parkinsonsData = createSampleData("parkinsons");
            const controlData = createSampleData("control");

            // Simulate key presses for both patients with sample data
            simulateKeyPresses(parkinsonsData, parkinsonsKeyboard.svg, "parkinsons", '#6c63ff', parkinsonsMetrics, startTime);
            simulateKeyPresses(controlData, controlKeyboard.svg, "control", '#ffb663', controlMetrics, startTime);
        } else {
            // Filter real data for each patient
            const parkinsonsData = data1.filter(d => d.pID === "1001");
            const controlData = data2.filter(d => d.pID === "1002");

            // Simulate key presses for both patients with real data
            simulateKeyPresses(parkinsonsData, parkinsonsKeyboard.svg, "parkinsons", '#6c63ff', parkinsonsMetrics, startTime);
            simulateKeyPresses(controlData, controlKeyboard.svg, "control", '#ffb663', controlMetrics, startTime);
        }
    }).catch(error => {
        console.error("Error in data loading:", error);

        // Fallback to sample data if any error occurs
        const parkinsonsData = createSampleData("parkinsons");
        const controlData = createSampleData("control");

        simulateKeyPresses(parkinsonsData, parkinsonsKeyboard.svg, "parkinsons", '#6c63ff', parkinsonsMetrics, startTime);
        simulateKeyPresses(controlData, controlKeyboard.svg, "control", '#ffb663', controlMetrics, startTime);
    });
}

// Call the main function when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    createComparativeVisualization();
});