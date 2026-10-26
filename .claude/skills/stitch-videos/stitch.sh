#!/usr/bin/env bash
# Usage: stitch.sh <clips_dir> <music_file> <output.mp4> [music_volume=0.12] [target_lufs=-16]
set -euo pipefail

DIR=${1:?clips dir}; MUSIC=${2:?music file}; OUT=${3:?output file}
VOL=${4:-0.12}; LUFS=${5:--16}
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

clips=()
while IFS= read -r f; do clips+=("$f"); done < <(
  find "$DIR" -maxdepth 1 -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' -o -iname '*.mkv' -o -iname '*.webm' \) | sort -V)
[ ${#clips[@]} -gt 0 ] || { echo "no clips in $DIR" >&2; exit 1; }

probe() { ffprobe -v error -select_streams v:0 -show_entries stream=$1 -of csv=p=0 "$2"; }
WIDTH=${WIDTH:-$(probe width "${clips[0]}")}
HEIGHT=${HEIGHT:-$(probe height "${clips[0]}")}
FPS=${FPS:-$(probe r_frame_rate "${clips[0]}" | awk -F/ '{printf "%d", ($2?$1/$2:$1)+0.5}')}
echo "Target: ${WIDTH}x${HEIGHT} @ ${FPS}fps, ${LUFS} LUFS, music vol ${VOL}"

jv() { echo "$1" | grep "\"$2\"" | sed 's/.*: "\(.*\)".*/\1/'; }
VF="scale=$WIDTH:$HEIGHT:force_original_aspect_ratio=decrease,pad=$WIDTH:$HEIGHT:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=$FPS,format=yuv420p"
ENC=(-c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -ar 48000 -ac 2)

: > "$TMP/list.txt"; i=0
for f in "${clips[@]}"; do
  i=$((i+1)); n="$TMP/c$(printf %03d $i).mp4"
  echo "[$i/${#clips[@]}] $(basename "$f")"
  if [ -n "$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$f" | head -1)" ]; then
    m=$(ffmpeg -hide_banner -nostdin -i "$f" -vn -af "loudnorm=I=$LUFS:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1)
    ln="loudnorm=I=$LUFS:TP=-1.5:LRA=11:measured_I=$(jv "$m" input_i):measured_TP=$(jv "$m" input_tp):measured_LRA=$(jv "$m" input_lra):measured_thresh=$(jv "$m" input_thresh):offset=$(jv "$m" target_offset):linear=true,aresample=48000"
    echo "    measured $(jv "$m" input_i) LUFS -> $LUFS"
    ffmpeg -hide_banner -loglevel error -nostdin -y -i "$f" -vf "$VF" -af "$ln" "${ENC[@]}" "$n"
  else
    echo "    no audio track, adding silence"
    ffmpeg -hide_banner -loglevel error -nostdin -y -i "$f" -f lavfi -i anullsrc=r=48000:cl=stereo -vf "$VF" -map 0:v -map 1:a -shortest "${ENC[@]}" "$n"
  fi
  echo "file '$n'" >> "$TMP/list.txt"
done

ffmpeg -hide_banner -loglevel error -nostdin -y -f concat -safe 0 -i "$TMP/list.txt" -c copy "$TMP/joined.mp4"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/joined.mp4")
FADE=$(awk -v d="$DUR" 'BEGIN{s=d-2; if(s<0)s=0; print s}')

ffmpeg -hide_banner -loglevel error -nostdin -y -i "$TMP/joined.mp4" -stream_loop -1 -i "$MUSIC" \
  -filter_complex "[1:a]volume=$VOL,afade=t=out:st=$FADE:d=2,aresample=48000[m];[0:a][m]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t "$DUR" "$OUT"

echo "Done: $OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of default=nw=1 "$OUT"
