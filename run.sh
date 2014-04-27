ssh -t root@snake.djrequester.com "bash -c 'cd /var/apps/current && git pull && export NODE_ENV=production && screen -dr'"
