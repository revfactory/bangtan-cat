#!/usr/bin/env bash
# usage: gen_one.sh <outname.png> <refs: both|bangi|tani> <prompt>
set -u
OUT="$1"; REF="$2"; PROMPT="$3"
cd /Users/robin/Downloads/bangtan-cat/generated
R=/Users/robin/Downloads/bangtan-cat/refs
case "$REF" in
  both) IMGS=(-i "$R/bangi_ref.jpg" -i "$R/tani_ref.jpg" -i "$R/both_ref.jpg");;
  bangi) IMGS=(-i "$R/bangi_ref.jpg" -i "$R/both_ref.jpg");;
  tani) IMGS=(-i "$R/tani_ref.jpg" -i "$R/both_ref.jpg");;
esac
BASE="첨부한 실제 사진들은 우리 집 고양이 두 마리다. 방이: 주황색 치즈태비(진한 주황 줄무늬, 크림빛 턱과 가슴, 분홍 젤리 발바닥, 동그란 얼굴, 호박빛 눈). 탄이: 턱시도 고양이(검은 몸, 이마 가운데로 올라가는 흰 블레이즈, 눈 주변과 귀는 검정, 분홍 코, 흰 주둥이와 흰 가슴, 아랫입술 바로 밑과 가슴 위쪽에 작은 검은 점, 흰 발, 노란빛 연두색 눈, 빨간 코바늘 뜨개 나비넥타이 목걸이). 첨부 사진 속 털 무늬·얼굴 생김새·체형을 최대한 그대로 유지한 채 같은 고양이로 보이는 새로운 사진을 이미지 생성 도구로 만들어라. 첨부 사진을 단순히 복사하거나 편집하지 말고 아래 장면을 새로 찍은 사진으로 생성할 것."
START=$(date +%s)
codex exec --sandbox workspace-write --skip-git-repo-check --cd /Users/robin/Downloads/bangtan-cat/generated \
  "${IMGS[@]}" -o ".logs/${OUT%.png}.md" \
  "$BASE

장면: $PROMPT

생성한 이미지를 반드시 ./$OUT 파일로 저장(PNG). 저장 후 파일 경로만 한 줄로 보고." > ".logs/${OUT%.png}.out" 2>&1 < /dev/null
END=$(date +%s)
if [ -s "$OUT" ]; then echo "OK $OUT $((END-START))s $(sips -g pixelWidth -g pixelHeight "$OUT" | tail -2 | awk '{print $2}' | tr '\n' 'x')"; else echo "FAIL $OUT $((END-START))s"; fi
