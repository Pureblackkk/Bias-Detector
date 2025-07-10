import sqlite3
from collections import defaultdict

class DatabaseConnector:
    def __init__(
        self, 
        database_path: str,
        table_name: str,
    ):
        self.database = sqlite3.connect(database_path)
        self.table_name = table_name
    
    def get_all_user_data(self):
        cursor = self.database.cursor()

        # Run SQL to generate all the data
        cursor.execute(f'SELECT * FROM {self.table_name}')

        rows = cursor.fetchall()
        
        column_names = [desc[0] for desc in cursor.description]

        result = [dict(zip(column_names, row)) for row in rows]

        # Group result by user_id
        result_user_id_data = defaultdict(list)

        for item in result:
            result_user_id_data[item['user_id']].append(item)

        return result_user_id_data
    
    def get_user_data_by_uid(self, uid: str):
        cursor = self.database.cursor()

        # Run SQL to generate all the data
        cursor.execute(f'SELECT * FROM {self.table_name} WHERE user_id == {uid}')

        rows = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]
        result = [dict(zip(column_names, row)) for row in rows]
        
        return {
            uid: result,
        }
    
    def get_user_data_by_solution_id(self, solution_id: int):
        cursor = self.database.cursor()

        # Run SQL to generate all the data
        cursor.execute(f'SELECT * FROM {self.table_name} WHERE id == {solution_id}')

        rows = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]
        result = [dict(zip(column_names, row)) for row in rows]

        final_res = {}
        final_res[result[0]['user_id']] = result

        return final_res

    def get_user_data_by_solution_id_list(self, solution_id_list: list):
        cursor = self.database.cursor()

        # Run SQL to generate all the data
        id_list = ', '.join(map(str, solution_id_list))
        cursor.execute(f'SELECT * FROM {self.table_name} WHERE id IN ({id_list})')

        rows = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]
        result = [dict(zip(column_names, row)) for row in rows]

        final_res = {}
        final_res[result[0]['user_id']] = result

        return final_res

    def get_user_data_by_user_id_and_dataset(self, uid: str, dataset: str):
        cursor = self.database.cursor()

        # Make sure select the latest strategy
        query = f"""
            SELECT * 
            FROM {self.table_name} AS t1
            WHERE user_id = \"{uid}\"
            AND dataset = \"{dataset}\"
            AND id = (
                SELECT MAX(id) 
                FROM {self.table_name} AS t2
                WHERE t1.solution_strategy  = t2.solution_strategy 
                AND t2.user_id = \"{uid}\"
                AND t2.dataset = \"{dataset}\"
            );
        """

        cursor.execute(query)

        rows = cursor.fetchall()
        column_names = [desc[0] for desc in cursor.description]
        result = [dict(zip(column_names, row)) for row in rows]
            
        return {
            uid: result,
        }