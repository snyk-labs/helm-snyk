import { flatImageSearch, isValidImageName } from "../main";

const legitConsoleError = console.error;
afterEach(() => {
  console.error = legitConsoleError; // because I re-assign console.error in a test below
});


test("validate we can find images in text", () => {
  const yamlText = `
  safjsadkfjsadf;sadfasdf
    fsafdsafkljsadfasf
    
    image: myimage0
    image: 'myimage1'
    image: "myimage2"
    
    image: somenamespace/myimage3
    image: 'somenamespace/myimage4'
    image: "somenamespace/myimage5"
    
    image: myimage6:sometag
    image: 'myimage7:sometag'
    image: "myimage8:sometag"
    
    image: somenamespace/myimage9:sometag
    image: 'somenamespace/myimage10:sometag'
    image: "somenamespace/myimage11:sometag"
    
    sdafadsfsadfsdafajksfhasdfads
  asdfsdafsadfsadfsad
  `;

  const imagesFound: string[] = flatImageSearch(yamlText);
  expect(imagesFound.length).toBe(12);
  expect(imagesFound[0]).toBe("myimage0");
  expect(imagesFound[1]).toBe("myimage1");
  expect(imagesFound[2]).toBe("myimage2");

  expect(imagesFound[3]).toBe("somenamespace/myimage3");
  expect(imagesFound[4]).toBe("somenamespace/myimage4");
  expect(imagesFound[5]).toBe("somenamespace/myimage5");

  expect(imagesFound[6]).toBe("myimage6:sometag");
  expect(imagesFound[7]).toBe("myimage7:sometag");
  expect(imagesFound[8]).toBe("myimage8:sometag");

  expect(imagesFound[9]).toBe("somenamespace/myimage9:sometag");
  expect(imagesFound[10]).toBe("somenamespace/myimage10:sometag");
  expect(imagesFound[11]).toBe("somenamespace/myimage11:sometag");
});

test("validate isValidImageName validates good imagenames and not bad ones", () => {
  expect(isValidImageName("someimage")).toBe(true);
  expect(isValidImageName("somenamespace/someimage")).toBe(true);
  expect(isValidImageName("someimage:sometag")).toBe(true);
  expect(isValidImageName("somenamespace/someimage:sometag")).toBe(true);

  expect(isValidImageName("somenamespace/some image:sometag")).toBe(false);
  expect(isValidImageName("somename space/someimage:sometag")).toBe(false);
  expect(isValidImageName("somenamespace/someimage:some tag")).toBe(false);
});

test("validate bad image names are not captured in image name search", () => {
  const yamlText = `
  safjsadkfjsadf;sadfasdf
    fsafdsafkljsadfasf
    
    image: my image0
    image: 'my image1'
    image: "my image2"
    
    image: some namespace/myimage3
    image: 'some namespace/myimage4'
    image: "some namespace/myimage5"
    
    image: myimage6:some tag
    image: 'myimage7:some tag'
    image: "myimage8:some tag"
    
    image: some namespace/my image9:some tag
    image: 'some namespace/my image10:some tag'
    image: "some namespace/my image11:some tag"
    
    image: "somelegitimagename"
    
    sdafadsfsadfsdafajksfhasdfads
  asdfsdafsadfsadfsad
  `;

  let consoleErrorStr: string = "";
  console.error = (msg) => consoleErrorStr += msg + "\n";

  const imagesFound: string[] = flatImageSearch(yamlText);
  expect(imagesFound.length).toBe(1);
  expect(imagesFound[0]).toBe("somelegitimagename");

  const rejectedImagenames: string[] = [
    "my image0",
    "my image1",
    "my image2",
    "some namespace/myimage3",
    "some namespace/myimage4",
    "some namespace/myimage5",
    "myimage6:some tag",
    "myimage7:some tag",
    "myimage8:some tag",
    "some namespace/my image9:some tag",
    "some namespace/my image10:some tag",
    "some namespace/my image11:some tag"
  ];

  rejectedImagenames.forEach((imageName) => {
    expect(consoleErrorStr.includes(`warning: image name thrown out because it didn't pass validation: ${imageName}`)).toBe(true);
  });
});
