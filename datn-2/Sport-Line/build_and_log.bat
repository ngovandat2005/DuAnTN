@echo off
call mvnw.cmd compile -DskipTests > compile_log.txt 2>&1
type compile_log.txt | findstr /i "error:"
