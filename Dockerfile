FROM judge0/judge0:latest
USER root
COPY isolate_mock.sh /usr/local/bin/isolate
RUN chmod +x /usr/local/bin/isolate
USER judge0
