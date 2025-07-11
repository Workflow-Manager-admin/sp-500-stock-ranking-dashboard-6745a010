#!/bin/bash
cd /home/kavia/workspace/code-generation/sp-500-stock-ranking-dashboard-6745a010/frontend_dashboard
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

