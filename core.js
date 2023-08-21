const math = require("mathjs");

function render(inputString, memory) {
    const pattern = /VAL(\d+|:[A-Za-z]+)/g;
    const render = inputString.replace(pattern, (match, index) => {
        const element = memory.find((item) => item.index == index);
        if (element) {
            if (element.index > memory.length) {
                return "VAL" + element.index;
            } else {
                return element.value;
            }
        } else {
            return match; // Keep the original match if index is not found in array
        }
    });
    return render;
}

function expression(exp, memory) {
    try {
        const exp1 = math.evaluate(render(exp[0], memory));
        const exp2 = math.evaluate(render(exp[1], memory));
        return [exp1, exp2];
    } catch (e) {
        const exp1 = render(exp[0], memory);
        const exp2 = render(exp[1], memory);
        return [exp1, exp2];
    }
}

function conditions(input, memory) {
    if (input.includes("==")) {
        exp = expression(input.split("=="), memory);
        if (exp[0] == exp[1]) {
            return true;
        } else {
            return false;
        }
    } else if (input.includes("!=")) {
        exp = expression(input.split("!="), memory);
        if (exp[0] != exp[1]) {
            return true;
        } else {
            return false;
        }
    } else if (input.includes(">=")) {
        exp = expression(input.split(">="), memory);
        if (exp[0] >= exp[1]) {
            return true;
        } else {
            return false;
        }
    } else if (input.includes("<=")) {
        exp = expression(input.split("<="), memory);
        if (exp[0] <= exp[1]) {
            return true;
        } else {
            return false;
        }
    } else if (input.includes(">")) {
        exp = expression(input.split(">"), memory);
        if (exp[0] > exp[1]) {
            return true;
        } else {
            return false;
        }
    } else if (input.includes("<")) {
        exp = expression(input.split("<"), memory);
        if (exp[0] < exp[1]) {
            return true;
        } else {
            return false;
        }
    }
}

function logical(input, memory) {
    const operators = ["&&", "||", "!"];

    for (const operator of operators) {
        if (input.includes(operator)) {
            const parts = input.split(operator);
            const left = parts[0].trim();
            const right = parts.slice(1).join(operator).trim();

            let leftResult;
            if (
                left.includes("==") ||
                left.includes("!=") ||
                left.includes(">=") ||
                left.includes("<=") ||
                left.includes(">") ||
                left.includes("<")
            ) {
                leftResult = conditions(left, memory);
            } else {
                leftResult = math.evaluate(render(left, memory));
            }

            let rightResult;
            if (
                right.includes("==") ||
                right.includes("!=") ||
                right.includes(">=") ||
                right.includes("<=") ||
                right.includes(">") ||
                right.includes("<")
            ) {
                rightResult = conditions(right, memory);
            } else {
                rightResult = math.evaluate(render(right, memory));
            }

            if (operator === "&&") {
                return leftResult && rightResult;
            } else if (operator === "||") {
                return leftResult || rightResult;
            } else if (operator === "!") {
                return !rightResult;
            }
        }
    }

    // If no logical operator is found, evaluate as a single condition
    if (
        input.includes("==") ||
        input.includes("!=") ||
        input.includes(">=") ||
        input.includes("<=") ||
        input.includes(">") ||
        input.includes("<")
    ) {
        return conditions(input, memory);
    } else {
        return math.evaluate(render(input, memory));
    }
}

function dataType(str) {
    //int
    const integerNumber = parseInt(str);
    if (!isNaN(integerNumber)) {
        return integerNumber;
    }

    //float
    const floatNumber = parseFloat(str);
    if (!isNaN(floatNumber)) {
        return floatNumber;
    }

    //boolean
    if (str.toLowerCase() === "true" || str.toLowerCase() === "false") {
        return str.toLowerCase() === "true";
    }

    //date
    const date = new Date(str);
    if (!isNaN(date)) {
        return date;
    }

    return str;
}

function parseCSV(filePath) {
    try {
        const csvData = fs.readFileSync(filePath, 'utf-8');
        const lines = csvData.split('\n');
        const header = lines[0].split(',');

        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === header.length) {
                const entry = {};
                for (let j = 0; j < header.length; j++) {
                    entry[header[j]] = values[j];
                }
                result.push(entry);
            }
        }

        return result;
    } catch (error) {
        console.error('Error reading or parsing CSV file:', error);
        return [];
    }
}

function isConditional(input) {
    return (
        input.includes("==") ||
        input.includes("!=") ||
        input.includes(">=") ||
        input.includes("<=") ||
        input.includes(">") ||
        input.includes("<")
    );
}

function isLogical(input) {
    return input.includes("&&") || input.includes("||") || input.includes("!");
}

module.exports = {
    render,
    expression,
    conditions,
    logical,
    dataType,
    isConditional,
    isLogical,
};
