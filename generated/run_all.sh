#!/usr/bin/env bash
cd /Users/robin/Downloads/bangtan-cat/generated
while IFS='|' read -r out ref prompt; do
  [ -s "$out" ] && continue
  printf '%s\0%s\0%s\0' "$out" "$ref" "$prompt 광고 촬영이 아니라 집사가 스마트폰으로 무심히 찍은 일상 스냅. 그 자리에 있는 자연광이나 실내 조명만으로 촬영하고 그림자가 한 방향으로 떨어짐. 수평이 1~2도 기울거나 피사체가 한쪽으로 살짝 치우친 자연스러운 프레이밍. 털 결·수염·귀 안쪽 잔털이 자연스럽고, 앞발의 발가락 개수와 관절도 자연스러움. 폰 카메라 특유의 가벼운 노이즈, 과한 보정·광택·CG 질감 없음. 글자나 로고가 보이는 소품 없음. 귀엽지만 실제로 있을 법한 순간."
done < jobs.txt | xargs -0 -n 3 -P 5 ./gen_one.sh
