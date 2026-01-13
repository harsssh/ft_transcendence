ARG STACK_VERSION
FROM docker.elastic.co/logstash/logstash:${STACK_VERSION}

USER root

# PostgreSQL JDBC driver
ARG POSTGRES_JDBC_VERSION=42.7.4
RUN mkdir -p /usr/share/logstash/vendor/jar/jdbc \
    && curl -fsSL -o /usr/share/logstash/vendor/jar/jdbc/postgresql.jar \
    https://repo1.maven.org/maven2/org/postgresql/postgresql/${POSTGRES_JDBC_VERSION}/postgresql-${POSTGRES_JDBC_VERSION}.jar \
    && chown -R logstash:logstash /usr/share/logstash/vendor/jar/jdbc
