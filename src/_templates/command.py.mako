## -*- coding: utf-8 -*-
# -*- coding: utf-8 -*-
import logging
import signal
import sys
import os

import pika
from scrapy.utils.log import configure_logging
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError, InvalidRequestError, DataError
from sqlalchemy.orm import sessionmaker

from util import mysql_connection_string
from .base_command import BaseCommand


class ${class_name}(BaseCommand):
    def __init__(self):
        super().__init__()

        self.engine = create_engine(mysql_connection_string())
        Session = sessionmaker(bind=self.engine)
        self.session = Session()

        logging.getLogger("pika").setLevel(os.getenv("PIKA_LOG_LEVEL"))

        parameters = pika.ConnectionParameters(
            host=os.getenv("RABBITMQ_HOST"),
            port=os.getenv("RABBITMQ_PORT"),
            virtual_host=os.getenv("RABBITMQ_VIRTUAL_HOST"),
            credentials=pika.credentials.PlainCredentials(
                username=os.getenv("RABBITMQ_USER"), password=os.getenv("RABBITMQ_PASS")
            ),
            heartbeat=0,
        )

        self.connection = pika.BlockingConnection(parameters)

        queue_name = ""
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=os.getenv(queue_name, ""), durable=True)

        self.stopped = False

    def signal_handler(self, signal, frame):
        self.logger.info("received signal, exiting...")
        self.stopped = True

    def add_options(self, parser):
        super().add_options(parser)

    def run(self, args, opts):
        self.set_logger("${logger_name}", self.settings.get("LOG_LEVEL"))
        configure_logging()

        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

        self.channel.close()
        self.connection.close()
        self.session.close()