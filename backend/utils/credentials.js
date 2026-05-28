const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Franchise = require('../models/Franchise');

const generatePassword = () => {
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const symbols = '!@#$%^&*';
    const numbers = '0123456789';

    let password = '';
    password += uppers[Math.floor(Math.random() * uppers.length)];
    password += lowers[Math.floor(Math.random() * lowers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    for(let i=0; i<5; i++) {
        password += numbers[Math.floor(Math.random() * numbers.length)];
    }
    return password;
};

const generateStudentUsername = async () => {
    const year = new Date().getFullYear();
    const count = await Student.countDocuments();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `GYA${year}${sequence}`;
};

const generateFacultyUsername = async () => {
    const count = await Faculty.countDocuments();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `FAC${sequence}`;
};

const generateFranchiseUsername = async (city = 'HQ') => {
    const cityCode = city.substring(0, 3).toUpperCase();
    const count = await Franchise.countDocuments();
    const sequence = (count + 1).toString().padStart(3, '0');
    return `FRN${cityCode}${sequence}`;
};

const generateEmployeeCode = async () => {
    const year = new Date().getFullYear();
    const count = await Faculty.countDocuments();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `EMP${year}${sequence}`;
};

module.exports = {
    generatePassword,
    generateStudentUsername,
    generateFacultyUsername,
    generateFranchiseUsername,
    generateEmployeeCode
};
