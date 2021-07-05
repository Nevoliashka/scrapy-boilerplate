from rmq.commands import Producer


class TestProducer(Producer):

    def init_task_queue_name(self, opts):
        self.task_queue_name ="_"

    def build_task_query_stmt(self, chunk_size):
        return "SELECT * FROM enimrac.comapnies WHERE status=0"

    def build_task_update_stmt(self, db_task, status):
        return f"UPDATE enimrac.comapnies set status=1 where id={db_task['id']}"
