
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import traceback

from rotas.laboratorio import bp_lab
from rotas.solicitacoes import bp_solicitacoes
from rotas.oee_rotas import bp_oee

diretorio_base = os.path.dirname(os.path.abspath(__file__))
DIRETORIO_DIST = os.path.join(diretorio_base, 'dist') 

app = Flask(__name__, static_folder=DIRETORIO_DIST, static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app.register_blueprint(bp_lab, url_prefix='/api')
app.register_blueprint(bp_solicitacoes, url_prefix='/api/solicitacoes')
app.register_blueprint(bp_oee, url_prefix='/api/oee')

@app.errorhandler(Exception)
def lidar_com_excecoes(e):
   
    traceback.print_exc()
    return jsonify({"sucesso": False, "erro": str(e)}), 500

@app.route('/api', methods=['GET'])
def api_ping():
   
    return jsonify({"status": "online", "mensagem": "LabManager API v3.0 "})

if __name__ == '__main__':
    porta = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=porta, use_reloader=False)