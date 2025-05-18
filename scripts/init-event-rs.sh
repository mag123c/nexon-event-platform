#!/bin/bash
set -e

echo '🕒 Waiting for event_mongo_dev (MongoDB) to be ready for ping...'
retry_count=0
max_ping_retries=30
until mongosh --host event_mongo_dev:27017 --quiet --eval 'db.adminCommand("ping")' &>/dev/null; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $max_ping_retries ]; then
    echo "❌ MongoDB (event_mongo_dev) did not respond to ping after $max_ping_retries retries."
    exit 1
  fi
  echo "Ping attempt $retry_count to event_mongo_dev failed. Retrying in 1 second..."
  sleep 1
done
echo '✅ MongoDB (event_mongo_dev) ping successful.'

echo '🚀 Initiating replica set "rsEvent" on event_mongo_dev:27017...'
mongosh --host event_mongo_dev:27017 --eval '
  try {
    rs.initiate({_id: "rsEvent", members: [{_id: 0, host: "event_mongo_dev:27017"}]});
    print("rs.initiate command sent.");
  } catch (e) {
    if (e.codeName === "AlreadyInitialized") {
      print("Replica set rsEvent already initialized.");
    } else if (e.codeName === "InvalidReplicaSetConfig" && e.message.includes("config servers must be started with --configsvr")) {
      print("Replica set rsEvent seems to have a config issue but might be initialized: " + e.message);
    }
    else {
      print("Error during rs.initiate: " + e.message);
      // 오류 발생 시 스크립트를 중단시키려면 아래 주석 해제
      // throw e;
    }
  }
'

echo '⏳ Waiting for event_mongo_dev to become PRIMARY...'
is_primary=false
for i in $(eval echo "{1..$max_ping_retries}"); do 
  if mongosh --host event_mongo_dev:27017 --quiet --eval 'rs.isMaster().ismaster' | grep -q "true"; then
    is_primary=true
    break
  fi
  echo "Still not PRIMARY (Attempt $i/$max_ping_retries)... rs.status():"
  mongosh --host event_mongo_dev:27017 --quiet --eval "printjson(rs.status())"
  sleep 1
done

if [ "$is_primary" = "true" ]; then
  echo '✅ Replica set "rsEvent" initialized and event_mongo_dev is PRIMARY.'
  if mongosh --host event_mongo_dev:27017 --quiet --eval "db.getSiblingDB('local').oplog.rs.stats().ok" | grep -q "1"; then
     echo "✅ oplog.rs found."
  else
     echo "⚠️ oplog.rs still not found. This might indicate an issue."
  fi
  exit 0 
else
  echo "❌ ERROR: event_mongo_dev did not become PRIMARY after $max_ping_retries attempts."
  echo "Final rs.status() on event_mongo_dev:"
  mongosh --host event_mongo_dev:27017 --quiet --eval "printjson(rs.status())"
  exit 1 
fi