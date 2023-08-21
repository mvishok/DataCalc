const readline = require("readline-sync");
const fs = require("fs");
const math = require("mathjs");
const csvParser = require("csv-parser");
const core = require("./core");
const { RETURN } = require("./codes");
const { exit } = require("process");

var index = 1;
const memory = [];
const commands = ["IF", "label", "type", "show", "print"];

function mainLoop() {
    console.log("DataCalc Compiler v0.0.1");
    memory.push({
        index: 0,
        status: RETURN.SUCCESS,
        value: "Running",
    });
    while (true) {
        const input = readline.question(index + ">> ");

        if (input.toLowerCase() === "quit") {
            console.log("Bye!");
            console.log(memory);
            break;
        }
        //processing the input
        if (input.startsWith("IF ")) {
            condition = core.render(input.replace("IF ", ""), memory);
            const statuses = [];
            const values = [];
            let active = true;
            if (core.isLogical(condition) && core.logical(condition, memory)) {
                while (active) {
                    block = readline.question("{}> ");
                    if (block == "END") {
                        active = false;
                    } else {
                        const blockProc = processData(block);
                        statuses.push(blockProc[0]);
                        values.push(blockProc[1]);
                    }
                }
                memory.push({ index: index, status: statuses, value: values });
                index++;
                continue;
            }

            if (
                core.isConditional(condition) &&
                core.conditions(condition, memory)
            ) {
                while (active) {
                    block = readline.question("{}> ");
                    if (block == "END") {
                        active = false;
                    } else {
                        const blockProc = processData(block);
                        statuses.push(blockProc[0]);
                        values.push(blockProc[1]);
                    }
                }
                memory.push({ index: index, status: statuses, value: values });
                index++;
                continue;
            }

            //if it is bare true / false (after rendering)
            if (core.render(condition, memory) == "true") {
                while (active) {
                    block = readline.question("{}> ");
                    if (block == "END") {
                        active = false;
                    } else {
                        const blockProc = processData(block);
                        statuses.push(blockProc[0]);
                        values.push(blockProc[1]);
                    }
                }
                memory.push({ index: index, status: statuses, value: values });
                index++;
                continue;
            }
        }

        const proc = processData(input);
        memory.push({ index: index, status: proc[0], value: proc[1] });
        index++;
    }
}

// function for processing input
function processData(input) {
    if (!input) {
        return [RETURN.SYNTAX];
    }

    //is math eq?
    try {
        return [RETURN.SUCCESS, math.evaluate(core.render(input, memory))];
    } catch (e) {
        //not a math equation
    }

    //is logical?
    if ((input.includes("&&") || input.includes("||")) && !commands.some((command) => input.includes(command))) {
        return [RETURN.SUCCESS, core.logical(input, memory)];
    }

    //is condition?
    if (
        (input.includes("==") ||
            input.includes("!=") ||
            input.includes(">=") ||
            input.includes("<=") ||
            input.includes(">") ||
            input.includes("<")) &&
        !commands.some((command) => input.includes(command))
    ) {
        return [RETURN.SUCCESS, core.conditions(input, memory)];
    }

    //splitting the input
    try {
        var inputArray = input.split(" ");
        var command = inputArray[0];
        var data = inputArray.slice(1).join(" ");
    } catch (e) {
        return [RETURN.SYNTAX, "Syntax Error"];
    }

    //commands
    if (command == "label") {
        data = data.split(" ");
        const index = memory.find((record) => record.index == data[0]);
        if (index) {
            index.index = ":" + data[1];
            return [RETURN.SUCCESS];
        } else {
            return [RETURN.MEMORY_NOT_FOUND, "Memory not found"];
        }
    }

    if (command == "type") {
        //todo: add multiple variable parsing in forloop
        res = typeof core.dataType(core.render(data, memory));
        console.log(res);
        return [RETURN.SUCCESS, typeof res];
    }

    if (command == "read") {
        if (fs.existsSync(data)) {
            try {
                const csvData = fs.readFileSync(data, "utf-8");
                const lines = csvData.split("\n");
                const header = lines[0].split(",");

                const result = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(",");
                    if (values.length === header.length) {
                        const entry = {};
                        for (let j = 0; j < header.length; j++) {
                            entry[header[j]] = values[j]
                                .replace(/"/g, "")
                                .replace(/'/g, "");
                        }
                        result.push(entry);
                    }
                }

                return [RETURN.SUCCESS, result];
            } catch (error) {
                return [RETURN.ERROR, error];
            }
        } else {
            console.log("File not found");
            return [RETURN.FILE_NOT_FOUND, "File not found"];
        }
    }

    if (command == "show") {
        //<memoryId> <column> IF <condition>

        let param = data.split(" ");
        let table;
        let cols;

        if (/VAL(\d+|:[A-Za-z]+)/g.test(param[0])) {
            param[0] = param[0].replace("VAL", "");
            table = memory[param[0]]["value"];
        }

        cols = Object.keys(table[0]);

        param = param.slice(1).join(" ");
        //<column> IF <condition>

        let lhs, rhs;

        if (param.includes("IF")) {
            param = param.split("IF");
            lhs = param[0].trim();
            rhs = core.render(param[1], memory).trim();
        }

        if (core.isConditional(rhs)) {
            var rows = [];
            for (const row of table) {
                let cond = rhs;
                for (const key in row) {
                    if (row.hasOwnProperty(key)) {
                        const value = row[key];
                        const regex = new RegExp(key, 'g');
                        cond = cond.replace(regex, value);
                    }
                }
                if (core.logical(cond, memory)) {
                    console.log(row);
                    rows.push(row);
                }
            }
            return [RETURN.SUCCESS, rows];
        }
        
        return [RETURN.ERROR, "No data found"]
    }

    if (command == "print") {
        data = core.render(data, memory);
        console.log(data);
        return [RETURN.SUCCESS];
    }

    if (command == "break") {
        return;
    }

    console.log("Undefined Call: " + command);
    return [RETURN.SYNTAX];
}

// Start the main loop
mainLoop();
