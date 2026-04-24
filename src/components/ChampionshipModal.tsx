import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Radio, Typography, theme, Space } from 'antd';
import { SettingOutlined, TrophyOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ChampionshipModalProps {
    open: boolean;
    onCancel: () => void;
    onSave: (values: any) => void;
    initialValues?: any;
    isEditing?: boolean;
    submitting?: boolean;
}

const ChampionshipModal: React.FC<ChampionshipModalProps> = ({
    open,
    onCancel,
    onSave,
    initialValues,
    isEditing = false,
    submitting = false,
}) => {
    const { token } = theme.useToken();
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue(initialValues);
            } else {
                form.resetFields();
                form.setFieldsValue({
                    format: 'GROUPS_KNOCKOUT',
                    teamCount: 8,
                    groupCount: 2,
                    advancingCount: 2,
                    roundTrip: false
                });
            }
        }
    }, [open, initialValues, form]);

    const handleOk = () => {
        form.validateFields().then(values => {
            onSave(values);
        });
    };

    return (
        <Modal
            title={
                <Space>
                    {isEditing ? <SettingOutlined /> : <TrophyOutlined />}
                    <span>{isEditing ? "Configurar Campeonato" : "Novo Campeonato"}</span>
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            okButtonProps={{ loading: submitting }}
            okText={isEditing ? "Salvar Alterações" : "Criar Campeonato"}
            cancelText="Cancelar"
            width={520}
            destroyOnClose={true}
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 16 }}
            >
                <Form.Item
                    name="name"
                    label="Nome do Campeonato"
                    rules={[{ required: true, message: 'Digite o nome do campeonato' }]}
                >
                    <Input placeholder="Ex: Copa Interbairros 2024" size="large" style={{ borderRadius: 8 }} disabled={submitting} />
                </Form.Item>

                <Form.Item name="format" label="Formato da Competição">
                    <Select
                        size="large"
                        style={{ borderRadius: 8 }}
                        disabled={submitting}
                        options={[
                            { label: 'Grupos + Mata-mata', value: 'GROUPS_KNOCKOUT' },
                            { label: 'Mata-mata Direto (em breve)', value: 'KNOCKOUT', disabled: true },
                            { label: 'Liga (Pontos Corridos) (em breve)', value: 'LEAGUE', disabled: true },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(prev, curr) => prev.format !== curr.format || prev.teamCount !== curr.teamCount || prev.groupCount !== curr.groupCount}
                >
                    {({ getFieldValue }) => {
                        const format = getFieldValue('format');
                        const teamCount = getFieldValue('teamCount') || 0;
                        const groupCount = getFieldValue('groupCount') || 1;

                        return (
                            <>
                                <Form.Item
                                    name="teamCount"
                                    label="Quantidade Total de Times"
                                    rules={[
                                        { required: true },
                                        { type: 'number', min: format === 'KNOCKOUT' ? 2 : 3, message: `Mínimo de ${format === 'KNOCKOUT' ? 2 : 3} times` }
                                    ]}
                                >
                                    <InputNumber min={2} style={{ width: '100%', borderRadius: 8 }} size="large" disabled={submitting} />
                                </Form.Item>

                                {format === 'GROUPS_KNOCKOUT' && (
                                    <>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="groupCount"
                                                    label="Qtd de Grupos"
                                                    rules={[
                                                        { required: true, message: 'Obrigatório' },
                                                        ({ getFieldValue: getVal }) => ({
                                                            validator(_, value) {
                                                                const tc = getVal('teamCount');
                                                                if (value > 1 && value % 2 !== 0) {
                                                                    return Promise.reject(new Error('Deve ser 1 ou par'));
                                                                }
                                                                if (tc % value !== 0) return Promise.reject(new Error('Indivisível'));
                                                                return Promise.resolve();
                                                            },
                                                        }),
                                                    ]}
                                                >
                                                    <InputNumber min={1} max={teamCount} style={{ width: '100%', borderRadius: 8 }} disabled={submitting} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="advancingCount"
                                                    label="Classif./Grupo"
                                                    rules={[
                                                        { required: true, message: 'Obrigatório' },
                                                        ({ getFieldValue: getVal }) => ({
                                                            validator(_, value) {
                                                                const tc = getVal('teamCount') || 0;
                                                                const gc = getVal('groupCount') || 1;
                                                                const teamsPerGroup = tc / gc;
                                                                if (value >= teamsPerGroup) {
                                                                    return Promise.reject(new Error(`Max: ${teamsPerGroup - 1}`));
                                                                }
                                                                return Promise.resolve();
                                                            },
                                                        }),
                                                    ]}
                                                >
                                                    <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} disabled={submitting} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <div style={{ 
                                            marginBottom: 20, 
                                            padding: '10px 14px', 
                                            background: token.colorFillQuaternary, 
                                            borderRadius: 10,
                                            border: `1px solid ${token.colorBorderSecondary}`
                                        }}>
                                            <Text type="secondary" style={{ fontSize: 13 }}>
                                                Configuração: <b>{groupCount}</b> grupos de <b>{teamCount / groupCount || 0}</b> times. 
                                                Avançam <b>{groupCount * (getFieldValue('advancingCount') || 0)}</b> para o mata-mata.
                                            </Text>
                                        </div>
                                    </>
                                )}

                                {format === 'LEAGUE' && (
                                    <Form.Item name="roundTrip" label="Sistema de Rodadas">
                                        <Radio.Group style={{ width: '100%' }} disabled={submitting}>
                                            <Radio.Button value={false} style={{ width: '50%', textAlign: 'center' }}>Turno Único</Radio.Button>
                                            <Radio.Button value={true} style={{ width: '50%', textAlign: 'center' }}>Ida e Volta</Radio.Button>
                                        </Radio.Group>
                                    </Form.Item>
                                )}
                            </>
                        );
                    }}
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ChampionshipModal;
