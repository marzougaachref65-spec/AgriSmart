import readline from 'node:readline'
import mongoose from 'mongoose'
import User from '../models/User.js'
import { connectDB } from '../config/db.js'
import { validerEmail, validerMotDePasse } from '../utils/password.js'

/**
 * Demande une valeur. En mode TTY, le mot de passe est saisi de façon masquée.
 * En mode non interactif, les variables ADMIN_NAME / ADMIN_EMAIL /
 * ADMIN_PASSWORD sont utilisées (pratique pour l'automatisation, jamais
 * écrites dans le code ni affichées).
 */
function demander(question, masquer = false) {
  return new Promise((resolve) => {
    if (masquer && process.stdin.isTTY) {
      process.stdout.write(question)
      const caracteres = []

      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.setEncoding('utf8')

      const surDonnee = (caractere) => {
        if (
          caractere === '\n' ||
          caractere === '\r' ||
          caractere === '\u0004'
        ) {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.removeListener('data', surDonnee)
          process.stdout.write('\n')
          resolve(caracteres.join(''))
          return
        }

        if (caractere === '\u0003') {
          process.stdin.setRawMode(false)
          process.stdout.write('\n')
          process.exit(1)
        }

        if (caractere === '\u007f' || caractere === '\b') {
          caracteres.pop()
          return
        }

        caracteres.push(caractere)
        process.stdout.write('*')
      }

      process.stdin.on('data', surDonnee)
      return
    }

    const interfaceLecture = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    interfaceLecture.question(question, (reponse) => {
      interfaceLecture.close()
      resolve(reponse)
    })
  })
}

async function main() {
  await connectDB()

  const nombreAdmins = await User.countDocuments({ role: 'ADMIN' })
  if (nombreAdmins > 0) {
    console.error('Un compte ADMIN existe déjà. Création refusée.')
    process.exitCode = 1
    return
  }

  const nonInteractif = !process.stdin.isTTY

  const nom = nonInteractif
    ? process.env.ADMIN_NAME
    : await demander('Nom complet : ')
  const email = nonInteractif
    ? process.env.ADMIN_EMAIL
    : await demander('Adresse e-mail : ')
  const motDePasse = nonInteractif
    ? process.env.ADMIN_PASSWORD
    : await demander('Mot de passe (masqué) : ', true)

  if (!nom || !email || !motDePasse) {
    console.error('Le nom, l\'e-mail et le mot de passe sont requis.')
    process.exitCode = 1
    return
  }

  const erreurEmail = validerEmail(email)
  if (erreurEmail) {
    console.error(erreurEmail)
    process.exitCode = 1
    return
  }

  const erreurMotDePasse = validerMotDePasse(motDePasse)
  if (erreurMotDePasse) {
    console.error(erreurMotDePasse)
    process.exitCode = 1
    return
  }

  const admin = await User.create({
    name: nom.trim(),
    email: email.trim().toLowerCase(),
    password: motDePasse,
    role: 'ADMIN',
    createdBy: null,
  })

  console.log('Compte ADMIN créé avec succès :')
  console.log('  id    =', admin._id.toString())
  console.log('  email =', admin.email)
  console.log('  rôle  =', admin.role)
  console.log('Le mot de passe n\'a pas été affiché.')
}

main()
  .catch((erreur) => {
    const message =
      erreur.code === 11000
        ? 'Cette adresse e-mail est déjà utilisée'
        : erreur.message
    console.error('Échec de la création :', message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
