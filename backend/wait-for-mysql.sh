#!/bin/bash
set -e

host="$1"
shift
cmd="$@"

until mysqladmin ping -h"$host" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --silent; do
    echo "Waiting for MySQL to be ready..."
    sleep 2
done

echo "MySQL is up - executing command"
exec $cmd