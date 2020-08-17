const assert = require("assert");
const getCommand = require("../src/shorthands/getCommand");

// Stripped down mock update objects
const mockUpdates = [
  {
    message: {
      text: "/start deep-linking-data-to-be-passed-on-as-a-single-string",
      entities: [{ offset: 0, length: 6, type: "bot_command" }],
    },
  },
  {
    message: {
      text: "/start deep linking data to be passed on as an array of strings",
      entities: [{ offset: 0, length: 6, type: "bot_command" }],
    },
  },
  {
    message: {
      text: "/start /start val1",
      entities: [
        { offset: 0, length: 6, type: "bot_command" },
        { offset: 7, length: 6, type: "bot_command" },
      ],
    },
  },
  {
    message: {
      text: "/start val1 /start val2",
      entities: [
        { offset: 0, length: 6, type: "bot_command" },
        { offset: 12, length: 6, type: "bot_command" },
      ],
    },
  },
];

// Expected results
const expectedResults = [
  JSON.stringify([["deep-linking-data-to-be-passed-on-as-a-single-string"]]),
  JSON.stringify([
    [
      "deep",
      "linking",
      "data",
      "to",
      "be",
      "passed",
      "on",
      "as",
      "an",
      "array",
      "of",
      "strings",
    ],
  ]),
  JSON.stringify([["/start", "val1"], ["val1"]]),
  JSON.stringify([["val1", "/start", "val2"], ["val2"]]),
];

describe("getCommand shortHand", function () {
  it("Should parse commands from update properly", function () {
    for (let i = 0; i < mockUpdates.length; i++)
      assert(
        JSON.stringify(getCommand.call({ update: mockUpdates[i] }, "start")) ===
          expectedResults[i],
        "Did not parse correctly"
      );
  });
});
