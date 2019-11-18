const setupPath = () => {
    let gamePath;
    switch (process.env.NODE_ENV) {
        case 'production':
            gamePath = '/stress-game';
            break;
        default:
            gamePath = '';
            break;
    };

    return gamePath;
};

export default setupPath;