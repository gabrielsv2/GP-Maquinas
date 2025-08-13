exports.handler = async function(event, context) {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Netlify Function funcionando!',
            timestamp: new Date().toISOString(),
            event: event.httpMethod,
            path: event.path
        })
    };
};
