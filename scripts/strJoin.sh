#!/bin/bash
# Extract subtitles from each MKV file in the given directory

# If no directory is given, work in local dir
if [ "$1" = "" ]; then
  DIR="."
else
  DIR="$1"
fi

if [ "$2" = "" ]; then
  BIN=""
else
  BIN="$2/"
fi

# Get all the MKV files in this dir and its subdirs
find "$DIR" -type f -name '*.mkv' | while read filename
do

    # Get base name for subtitle
    subtitlename=${filename%.*}

	# Rename new file as temporary name
	mv "$subtitlename.mkv" "$subtitlename.tmp.mkv" > /dev/null 2>&1 

	# Add subtitle in a new file 
	mkvmerge -o "$subtitlename.mkv" "$subtitlename.tmp.mkv" --language 0:pt "$subtitlename.srt" 

	# Change Permissions file
	chmod g+rw "$subtitlename.mkv" 

	# Makes new subtitle as default
	mkvpropedit "$subtitlename.mkv" --edit track:s1 --set flag-default=0 --edit track:s2 --set flag-default=1

	# Remove original file
	rm "$subtitlename.tmp.mkv"

	# Remove subtitle file
	rm "$subtitlename.srt"

done




