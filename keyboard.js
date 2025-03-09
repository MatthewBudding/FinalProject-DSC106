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

// Function to create the keyboard SVG elements
function createKeyboardSVG(layout) {
    const keyWidth = 40;
    const keyHeight = 40;
    const keySpacing = 5;

    // Calculate offsets for better alignment
    const rowOffsets = [
        0,                  // Row 1 (QWERTY)
        keyWidth * 0.5,     // Row 2 (ASDF)
        keyWidth,           // Row 3 (ZXCV)
        keyWidth * 1.5      // Row 4 (Ctrl, Space, Ctrl)
    ];

    //Calculate a good total width
    const totalWidth = layout[0].length * (keyWidth + keySpacing) + keySpacing + keyWidth * 1.5;
    const totalHeight = layout.length * (keyHeight + keySpacing) + keySpacing;

    const svg = d3.create("svg")
        .attr("width", totalWidth)
        .attr("height", totalHeight)
        .attr("class", "keyboard-svg");

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
        .attr("id", d => `key-${d.key}`);  // Keep the ID for targeting

    keys.append("rect")
        .attr("width", d => d.width)
        .attr("height", keyHeight)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", "white")
        .attr("stroke", "#ccc");

    keys.append("text")
        .attr("x", d => d.width / 2)
        .attr("y", keyHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "#333")
        .attr("font-size", "14px")
        .text(d => d.key);

    return svg.node();
}

// Function to simulate key presses based on the data
function simulateKeyPresses(data, svg) {
    const keyPressDuration = 200; // milliseconds for visual feedback (adjust as needed)

    // Filter for relevant keys
    const validKeys = new Set([
        ...'abcdefghijklmnopqrstuvwxyz '.split(''), 'Shift_L', 'Shift_R', 'Caps_Lock', 'Enter', 'Tab', 'Control_L', 'Control_R', 'BackSpace'
    ]);

    const filteredData = data.filter(entry => validKeys.has(entry.key));
    filteredData.forEach(entry => {

        // Timeouts for press
        const pressTimeout = setTimeout(() => {
            const keyElement = svg.querySelector(`#key-${entry.key}`);

            if (keyElement) {
                d3.select(keyElement).select("rect").attr("fill", "#add8e6"); // Light blue on press
            }
        }, entry.press_0 * 1000); // Convert seconds to milliseconds

        // Timeouts for release
        const releaseTimeout = setTimeout(() => {
            const keyElement = svg.querySelector(`#key-${entry.key}`);
            if (keyElement) {
                d3.select(keyElement).select("rect").attr("fill", "white"); // Go back to white
            }
        }, entry.release_0 * 1000);
    });
}


// Main function to create and animate the keyboard
function createAnimatedKeyboard() {
    // Create the keyboard layout
    const layout = createKeyboardLayout();

    // Create the SVG keyboard
    const keyboardSVG = createKeyboardSVG(layout);

    // Append the keyboard SVG to the container
    document.getElementById("keyboard-container").appendChild(keyboardSVG);

    // Load the relevant data, this time from csv
    d3.csv("data/keystroke_data.csv").then(data => { // Updated data path
        //Filter by pID
        const pID_filter = "1002";
        const filteredData = data.filter(d => d.pID === pID_filter);
        // Simulate the key presses, passing in the SVG element
        simulateKeyPresses(filteredData, keyboardSVG);
    }).catch(error => {
        console.error("Error loading the data:", error);
    });;
}

// Call the main function when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make call to create animated keyboard
    createAnimatedKeyboard();
});