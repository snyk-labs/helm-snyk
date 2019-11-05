const Readable = require('stream').Readable;

beforeEach(() => {
  jest.resetModules();
});

test('verify pullImage handles failing due to bad image name', async () => {
  jest.doMock("dockerode", () => {
    return jest.fn().mockImplementation(() => {
      return {
        pull: (command, callback) => {
          const err = {
            statusCode: 405,
            message: "mock error message"
            // message: "(HTTP code 404) unexpected - pull access denied for non-existing-image, repository does not exist or may require 'docker login'"
          };
          callback(err, null);
        }
      };
    });
  });

  const mainModule = require("../main");
  const res = await mainModule.pullImage("non-existing-image").catch((error) => {
    expect(error.statusCode).toBe(405);
    expect(error.message.includes("mock error message")).toBe(true);
  });
});

function mockPullOk(command, callback) {
  const msg = "{\"status\":\"Status: Downloaded newer image for some-image:latest\"}";

  const s = new Readable();
  s.push(msg);
  s.push(null);

  callback(null, s);
}

function doMockWithPullOk() {
  jest.doMock("dockerode", () => {
    return jest.fn().mockImplementation(() => {
      return {
        pull: mockPullOk
      };
    });
  });
}

test('handle ok pull correctly from pull function main module', async () => {
  doMockWithPullOk();

  const mainModule = require("../main");
  const imageName = "some-image";
  const res = await mainModule.pullImage(imageName).catch((error) => {
    fail();
  });

  expect(res).toBe("{\"status\":\"Status: Downloaded newer image for some-image:latest\"}");
});

test('handle ok pull correctly from pull function main module - alternate way of dealing with result', async () => {
  doMockWithPullOk();

  const mainModule = require("../main");
  const imageName = "some-image";
  let receivedMsg = "";

  const res = await mainModule.pullImage(imageName).catch((error) => {
    fail();
  })
    .then((retVal) => {
      receivedMsg = retVal as string;
    });

  expect(receivedMsg).toBe("{\"status\":\"Status: Downloaded newer image for some-image:latest\"}");
});
