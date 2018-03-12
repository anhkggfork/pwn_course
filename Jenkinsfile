pipeline {
    agent { label 'Test_Node'}
    stages {
        stage('Build') {
            steps {
                echo "[*] Building..."
                sh 'mkdocs build'
                echo "[+] Build Done!"
            }
        }
        stage('Test') {
            steps {
                echo "[*] Testing..."
                echo "[+] Test Done!"
            }
        }
        stage("Deploy") {
            steps {
                echo "[*] Deploying..."
                sh 'sh ./scripts/docker_build_push.sh'
                sh 'docker-compose up -d'
                echo "[+] Deploy Done!"
            }
        }
    }
}
