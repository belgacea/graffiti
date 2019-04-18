# Graffiti
Graffiti is a desktop application to manage your entire video library.

## Features
- Search among your entire library
- Tags to quickly find a video
- Grid view as thumbnails
- Screenshots for the entire length video

## Installing

- Download and install the [latest](https://github.com/jamelait/graffiti/releases/latest) Graffiti from the releases.

## Supported platforms
- Windows (64/32bit)
- macOS and Linux are not yet supported.

## Supported formats

The following formats are recongized: .avi, .mov, .wmv, .mp4, .m4v, .mkv, .3gp, .divx, .flv, .mpg, .mpeg, .f4v, .ts, .webm, .asf, .m2ts.

## Keyboard shortcuts
<kbd>CTRL</kbd>+<kbd>F</kbd> Focus on search bar.

<kbd>CTRL</kbd>+<kbd>H</kbd> Navigate to Home.

<kbd>DEL</kbd> Move the video to the bin.

<kbd>ENTER</kbd> or <kbd>SPACE</kbd> Play the video.

<kbd>P</kbd> or <kbd>V</kbd> Previous video.

<kbd>N</kbd> Next video.

<kbd>CTRL</kbd>+<kbd>E</kbd> Open the containing folder.

<kbd>F2</kbd> Rename video.

## Advanced search
Start the search string with " (double quotes) to keep the string as is, otherwise it will be cleaned up (removal of special characters...).

Type -- (double dash) right before the word (no spaces) to exclude that word from the results.

## Development

This app is built with Electron. Make sure you have at least node v8 and yarn installed.
```
git clone https://github.com/jamelait/graffiti.git
cd graffiti
yarn install
```

### Running
In one terminal:
```
yarn dev
```
In another:
```
yarn start
```

## Credits
- Icon made by [Pixel perfect](https://icon54.com/ "Pixel perfect") from [www.flaticon.com](http://www.flaticon.com "Flaticon").
