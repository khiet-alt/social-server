const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { UserInputError } = require("apollo-server") 

const { SECRET_KEY } = require('../../config.js')

const User = require('../../models/User')

const { validateRegisterInput, validateLoginInput } = require('../../util/validators')

function generateToken(user) {
    return jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username
    }, SECRET_KEY, {expiresIn: '24h'})
}

module.exports = {
    Mutation: {
        async login(_, {username, password}){
            const { valid, errors } = validateLoginInput(username, password)
            if ( !valid) 
                throw new UserInputError('User invalid', { errors })

            const user = await User.findOne({ username })

            if ( !user) {
                errors.general = 'User not Found'
                throw new UserInputError('User not found', { errors })
            }
            
            const match = await bcrypt.compare(password, user.password)
            if ( !match ){
                errors.general = 'Wrong credentials'
                throw new UserInputError('Wrong credentials', { errors })
            }

            const token = generateToken(user)
            return {
                ...user._doc,    // this is document already saved at db
                id: user._id,
                token
            }
        },

        async register(_, { registerInput: {username, email, password, confirmPassword} }, context, info){
            //TODO: Validate user data
            const { errors, valid } = validateRegisterInput(username, email, password, confirmPassword)
            if ( !valid )
                throw new UserInputError('Not valid', { errors })

            //TODO: make sure user doesn't exist already
            const user = await User.find({ username })

            if (user.length > 0){
                throw new UserInputError('This user already exists', {
                    errors: {
                        username: 'This user is already taken'
                    }
                })
            }
            
            //TODO: hash password and create auth token
            password = await bcrypt.hash(password, 12)

            const newUser = new User({
                email,
                username,
                password,
                createdAt: new Date().toISOString()
            })

            const res = await newUser.save()

            const token = generateToken(res)

            return {
                ...res._doc,    // this is document already saved at db
                id: res._id,
                token
            }
        }
    }
}