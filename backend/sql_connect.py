import pymysql
import datetime

__cnx = None

def connect_sql():
    global __cnx 
    if __cnx is None:
        __cnx = pymysql.connect(
            host='localhost',
            user='root',
            password='',  # ✅ Replace with your actual password
            database='grocerry',
            cursorclass=pymysql.cursors.DictCursor
        )
    print('✅ You got connected')
    return __cnx

# ✅ TEST CONNECTION
if __name__ == "__main__":
    try:
        conn = connect_sql()
        print("✅ Connection successful!")
        conn.close()
    except Exception as e:
        print("❌ Connection failed:", e)
