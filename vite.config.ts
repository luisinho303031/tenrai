import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    {
      name: 'create-obra-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/local/gerar-obra' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                const data = JSON.parse(body)
                const obraPath = path.resolve(__dirname, 'src/data/obras', data.id)
                const registryPath = path.resolve(__dirname, 'src/data/obras/todasobras.json')

                // Criar pasta da obra
                if (!fs.existsSync(obraPath)) {
                  fs.mkdirSync(obraPath, { recursive: true })
                }

                const obraInfo = {
                  id: data.id,
                  meta: data.meta,
                  imagens: data.imagens,
                  generos: data.generos
                }

                // Criar info.json
                fs.writeFileSync(
                  path.join(obraPath, 'info.json'),
                  JSON.stringify(obraInfo, null, 2),
                  'utf-8'
                )

                // Criar capitulos.json
                if (!fs.existsSync(path.join(obraPath, 'capitulos.json'))) {
                  fs.writeFileSync(
                    path.join(obraPath, 'capitulos.json'),
                    JSON.stringify({ capitulos: [] }, null, 2),
                    'utf-8'
                  )
                }

                // Atualizar todasobras.json (apenas o essencial)
                let registry = []
                if (fs.existsSync(registryPath)) {
                  registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
                }

                const registroSimplificado = {
                  id: data.id,
                  titulo: data.meta.titulo,
                  tituloAlternativo: data.meta.tituloAlternativo,
                  status: data.meta.status,
                  capa: data.imagens.capa,
                  generos: data.generos
                }

                // Remover se já existir (update) e adicionar novo
                registry = registry.filter((o: any) => o.id !== data.id)
                registry.push(registroSimplificado)

                fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8')

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, message: 'Obra criada e registrada!' }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
          } else if (req.url && req.url.startsWith('/api/local/gerar-obra/') && req.method === 'DELETE') {
            try {
              const id = req.url.split('/').pop()
              if (!id) throw new Error('ID não fornecido')

              const obraPath = path.resolve(__dirname, 'src/data/obras', id)
              const registryPath = path.resolve(__dirname, 'src/data/obras/todasobras.json')

              // Remover pasta se existir
              if (fs.existsSync(obraPath)) {
                fs.rmSync(obraPath, { recursive: true, force: true })
              }

              // Atualizar registro
              if (fs.existsSync(registryPath)) {
                let registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
                registry = registry.filter((o: any) => o.id !== id)
                fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8')
              }

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, message: 'Obra excluída!' }))
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          } else if (req.url === '/api/local/adicionar-capitulo' && req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                const data = JSON.parse(body) // { id, numero, titulo, imagens }
                const obraPath = path.resolve(__dirname, 'src/data/obras', data.id)
                const capsPath = path.join(obraPath, 'capitulos.json')

                if (!fs.existsSync(capsPath)) {
                  throw new Error('Obra não encontrada ou capitulos.json ausente')
                }

                const capsData = JSON.parse(fs.readFileSync(capsPath, 'utf-8'))

                const novoCap = {
                  id: parseInt(data.numero),
                  numero: parseInt(data.numero),
                  titulo: data.titulo || `Capítulo ${data.numero}`,
                  dataPublicacao: new Date().toISOString(),
                  imagens: data.imagens
                }

                // Substituir se já existir, senão adicionar
                const index = capsData.capitulos.findIndex((c: any) => c.numero === novoCap.numero)
                if (index !== -1) {
                  capsData.capitulos[index] = novoCap
                } else {
                  capsData.capitulos.push(novoCap)
                }

                // Ordenar capítulos por número (opcional, mas bom)
                capsData.capitulos.sort((a: any, b: any) => b.numero - a.numero)

                fs.writeFileSync(capsPath, JSON.stringify(capsData, null, 2), 'utf-8')

                // Mover obra para o topo das atualizações em todasobras.json
                const registryPath = path.resolve(__dirname, 'src/data/obras/todasobras.json')
                if (fs.existsSync(registryPath)) {
                  let registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
                  const obraRegistro = registry.find((o: any) => o.id === data.id)
                  if (obraRegistro) {
                    registry = registry.filter((o: any) => o.id !== data.id)
                    registry.push(obraRegistro) // Adiciona ao final (será o primeiro ao inverter)
                    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8')
                  }
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, message: 'Capítulo adicionado!' }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
          } else {
            next()
          }
        })
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.verdinha.wtf',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
