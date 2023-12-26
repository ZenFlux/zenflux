find . -type f -name '*.js' -exec bash -c 'for file; do mv "$file" "$(echo "${file%.js}" | sed "s/\([a-z]\)\([A-Z]\)/\1-\2/g" | tr "[:upper:]" "[:lower:]").js"; done' bash {} +

for file in *.js; do
  if [[ "$file" == *-test* ]]; then
    new_name=$(echo "$file" | sed 's/-test\./.test./')
    mv "$file" "$new_name"
    echo "Renamed $file to $new_name"
  fi
done
