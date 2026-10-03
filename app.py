# -*- coding: utf-8 -*-
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import psycopg2
from flask_bcrypt import Bcrypt

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# -----------------------------------
#   CONEXIÓN A POSTGRESQL
# -----------------------------------
def get_db():
    try:
        conn = psycopg2.connect(
            host="localhost",
            dbname="parkspotter2",
            user="postgres",
            password="Santysala1!",
            port=5432,
            client_encoding='utf8'
        )
        return conn
    except Exception as e:
        print("\n❌ ERROR DE CONEXIÓN A POSTGRESQL:")
        print(repr(e))   # <-- usa repr() en vez de print(e) directo
        return None


# -----------------------------------
#   LANDING PAGE
# -----------------------------------
@app.route("/")
def landing():
    return render_template("index.html")


# -----------------------------------
#   LOGIN
# -----------------------------------
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Faltan datos"}), 400

    conn = get_db()
    if conn is None:
        return jsonify({"success": False, "message": "Error conectando a la base de datos"}), 500

    cur = conn.cursor()

    cur.execute("""
        SELECT id, password, verificado
        FROM usuarios
        WHERE email = %s
    """, (email,))
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        return jsonify({"success": False, "message": "Usuario no existe"}), 404

    user_id, hashed_pw, verificado = user

    if bcrypt.check_password_hash(hashed_pw, password):
        return jsonify({
            "success": True,
            "message": "Inicio de sesión exitoso",
            "user_id": user_id,
            "verificado": verificado
        }), 200

    return jsonify({"success": False, "message": "Contraseña incorrecta"}), 401


# -----------------------------------
#   REGISTRO
# -----------------------------------
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    data = request.get_json()

    nombre = data.get("name")
    email = data.get("email")
    password = data.get("password")
    telefono = data.get("telefono")
    ciudad = data.get("ciudad")
    rol = data.get("rol", "conductor")

    if not nombre or not email or not password:
        return jsonify({"success": False, "message": "Faltan datos"}), 400

    conn = get_db()
    if conn is None:
        return jsonify({"success": False, "message": "Error conectando a la base de datos"}), 500

    cur = conn.cursor()

    # Verificar email existente
    cur.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
    existing = cur.fetchone()

    if existing:
        cur.close()
        conn.close()
        return jsonify({"success": False, "message": "El email ya está registrado"}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")

    try:
        cur.execute("""
            INSERT INTO usuarios (nombre, email, password, telefono, ciudad, rol, verificado)
            VALUES (%s, %s, %s, %s, %s, %s, FALSE)
        """, (nombre, email, hashed_pw, telefono, ciudad, rol))

        conn.commit()

        return jsonify({"success": True, "message": "Usuario creado exitosamente"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    finally:
        cur.close()
        conn.close()

# -----------------------------------
#   VERIFICACIÓN POST-LOGIN
# -----------------------------------
@app.route("/verificacion", methods=["GET", "POST"])
def verificacion():
    if request.method == "GET":
        return render_template("verificacion.html")

    data = request.get_json()
    tipo = data.get("tipo_usuario")
    documento = data.get("documento")
    telefono = data.get("telefono")
    user_id = data.get("user_id")

    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        UPDATE usuarios
        SET tipo_usuario=%s, documento=%s, telefono=%s, verificado=TRUE
        WHERE id=%s
    """, (tipo, documento, telefono, user_id))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True})


# -----------------------------------
#   MENÚ
# -----------------------------------
@app.route("/menu")
def menu():
    return render_template("menu.html")

@app.route("/publicar-garaje")
def publicar_garaje():
    return render_template("publicar_garaje.html")


@app.route("/mis-garajes")
def mis_garajes():
    return render_template("mis_garajes.html")

@app.route("/ingresos")
def ingresos():
    return render_template("ingresos.html")

@app.route("/micuenta")
def mi_cuenta():
    return render_template("micuenta.html")

@app.route("/mis-arriendos")
def mis_arriendos():
    return render_template("mis_arriendos.html")

# -----------------------------------
#   EJECUCIÓN
# -----------------------------------
if __name__ == "__main__":
    print("🔥 Servidor Flask corriendo en http://127.0.0.1:5000")
    app.run(debug=True)

@app.route("/api/estado_verificacion/<int:user_id>")
def estado_verificacion(user_id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT verificado FROM usuarios WHERE id = %s", (user_id,))
    result = cur.fetchone()

    cur.close()
    conn.close()

    if not result:
        return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

    return jsonify({"success": True, "verificado": result[0]})

