export const imagePastingListener = (rtf, html) => {
  const ret = {};
  const imgTags = extractTagsFromHtml(html);
  const newSrcValues = [];

  const hexImages = extractFromRtf(rtf);
  if (hexImages.length === 0) {
    return;
  }

  for (let i = 0; i < hexImages.length; i++) {
    const base64string = createSrcWithBase64(hexImages[i]);

    newSrcValues.push('data:image/png;base64,' + base64string);
  }

  if (imgTags.length === newSrcValues.length) {
    for (let i = 0; i < imgTags.length; i++) {
      if (imgTags[i].indexOf('file://') === 0 && newSrcValues[i]) {
        ret[imgTags[i]] = newSrcValues[i];
      }
    }
  }

  return ret;
};

const extractFromRtf = rtfContent => {
  const ret = [];
  const rePictureHeader = /\{\\pict[\s\S]+?\\bliptag\-?\d+(\\blipupi\-?\d+)?(\{\\\*\\blipuid\s?[\da-fA-F]+)?[\s\}]*?/;
  const rePicture = new RegExp(`(?:(${rePictureHeader.source}))([\\da-fA-F\\s]+)\\}`, 'g');
  let imageType = '';

  const wholeImages = rtfContent.match(rePicture);
  if (!wholeImages) {
    return ret;
  }

  for (let i = 0; i < wholeImages.length; i++) {
    if (rePictureHeader.test(wholeImages[i])) {
      if (wholeImages[i].indexOf('\\pngblip') !== -1) {
        imageType = 'image/png';
      } else if (wholeImages[i].indexOf('\\jpegblip') !== -1) {
        imageType = 'image/jpeg';
      } else {
        continue;
      }

      ret.push({
        hex: imageType ? wholeImages[i].replace(rePictureHeader, '').replace(/[^\da-fA-F]/g, '') : null,
        type: imageType,
      });
    }
  }

  return ret;
};

export const extractTagsFromHtml = html => {
  const regexp = /<img[^>]+src="([^"]+)[^>]+/g;
  const ret = [];
  let item;

  while ((item = regexp.exec(html))) {
    ret.push(item[1]);
  }

  return ret;
};

const convertHexStringToBytes = hexString => {
  const bytesArray = [];
  const bytesArrayLength = hexString.length / 2;
  let i;

  for (i = 0; i < bytesArrayLength; i++) {
    bytesArray.push(parseInt(hexString.substr(i * 2, 2), 16));
  }
  return bytesArray;
};

function createSrcWithBase64(img) {
  const ret = null;
  return convertBytesToBase64(convertHexStringToBytes(img.hex));
}

const convertBytesToBase64 = bytesArray => {
  const base64characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64string = '';
  const bytesArrayLength = bytesArray.length;
  let i;

  for (i = 0; i < bytesArrayLength; i += 3) {
    const array3 = bytesArray.slice(i, i + 3);
    const array3length = array3.length;
    const array4 = [];

    if (array3length < 3) {
      for (let j = array3length; j < 3; j++) {
        array3[j] = 0;
      }
    }

    array4[0] = (array3[0] & 0xfc) >> 2;
    array4[1] = ((array3[0] & 0x03) << 4) | (array3[1] >> 4);
    array4[2] = ((array3[1] & 0x0f) << 2) | ((array3[2] & 0xc0) >> 6);
    array4[3] = array3[2] & 0x3f;

    for (let j = 0; j < 4; j++) {
      if (j <= array3length) {
        base64string += base64characters.charAt(array4[j]);
      } else {
        base64string += '=';
      }
    }
  }
  return base64string;
};
