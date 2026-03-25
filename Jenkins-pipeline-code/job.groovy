pipelineJob('pos-app-pipeline') {
    description('Auto-generated Backend Pipeline for Phufa Cafe POS')
    definition {
        cpsScm {
            scm {
                git {
                    remote {
                        url('https://github.com/bommxun2/phufa-cafe-pos.git')
                    }
                    branch('main')
                }
            }
            scriptPath('Jenkins-pipeline-code/Jenkinsfile-backend')
        }
    }
}

pipelineJob('frontend-app-pipeline') {
    description('Auto-generated Frontend Pipeline for Phufa Cafe POS')
    definition {
        cpsScm {
            scm {
                git {
                    remote {
                        url('https://github.com/bommxun2/phufa-cafe-pos.git')
                    }
                    branch('main')
                }
            }
            scriptPath('Jenkins-pipeline-code/Jenkinsfile-frontend')
        }
    }
}