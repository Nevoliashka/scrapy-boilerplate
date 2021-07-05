import logging

import yaml

routing_config = {}

with open("rmq/routing.yaml") as f:
    routing_config = yaml.safe_load(f)
    logging.info(f"Load routing config {routing_config}")
